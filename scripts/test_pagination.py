import subprocess
import time
import json
import urllib.request
import socket
import base64
import os
import struct
import tempfile

def run_pagination_test():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    temp_dir = tempfile.mkdtemp()
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        "--remote-debugging-port=9455",
        f"--user-data-dir={temp_dir}",
        "--disable-gpu",
        "--no-sandbox",
        "about:blank"
    ])
    
    time.sleep(2)
    
    try:
        req = urllib.request.urlopen("http://127.0.0.1:9455/json")
        tabs = json.loads(req.read().decode())
        ws_url = tabs[0]["webSocketDebuggerUrl"]
        path = "/" + ws_url.split("/", 3)[3]
        
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("127.0.0.1", 9455))
        
        key = base64.b64encode(os.urandom(16)).decode('utf-8')
        handshake = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: 127.0.0.1:9455\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n\r\n"
        )
        s.sendall(handshake.encode('utf-8'))
        resp = s.recv(4096).decode('utf-8', errors='ignore')
        assert "101" in resp
        
        def send_frame(msg_str):
            payload = msg_str.encode('utf-8')
            mask = os.urandom(4)
            masked = bytearray(b ^ mask[i % 4] for i, b in enumerate(payload))
            header = bytearray([0x81])
            length = len(payload)
            if length < 126:
                header.append(0x80 | length)
            elif length < 65536:
                header.append(0x80 | 126)
                header.extend(struct.pack('>H', length))
            else:
                header.append(0x80 | 127)
                header.extend(struct.pack('>Q', length))
            header.extend(mask)
            s.sendall(header + masked)

        def recv_frame():
            data = s.recv(2)
            if not data or len(data) < 2:
                return None
            b1, b2 = data[0], data[1]
            length = b2 & 0x7f
            if length == 126:
                length = struct.unpack('>H', s.recv(2))[0]
            elif length == 127:
                length = struct.unpack('>Q', s.recv(8))[0]
            
            payload = bytearray()
            while len(payload) < length:
                chunk = s.recv(min(length - len(payload), 65536))
                if not chunk:
                    break
                payload.extend(chunk)
            return payload.decode('utf-8', errors='ignore')

        msg_id = 0
        def cdp_call(method, params=None):
            nonlocal msg_id
            msg_id += 1
            cmd = {"id": msg_id, "method": method, "params": params or {}}
            send_frame(json.dumps(cmd))
            
            while True:
                raw = recv_frame()
                if not raw:
                    return None
                try:
                    res = json.loads(raw)
                    if res.get("id") == msg_id:
                        return res
                except:
                    pass

        print("\n--- TEST: Paginación en mercado.html ---")
        cdp_call("Page.enable")
        cdp_call("Page.navigate", {"url": "http://localhost:5500/mercado.html"})
        time.sleep(2.5) # Wait for page load & loadProductsFromSupabase
        
        # 1. Verificar Página 1 Inicial
        res = cdp_call("Runtime.evaluate", {"expression": """(() => {
            const countLabel = document.getElementById('products-count-label')?.textContent || '';
            const paginationLabel = document.getElementById('products-pagination-label')?.textContent || '';
            const cardsCount = document.querySelectorAll('#products-grid > div').length;
            const buttons = Array.from(document.querySelectorAll('#products-pagination-controls button')).map(b => ({
                text: b.textContent.trim(),
                disabled: b.disabled,
                classes: b.className
            }));
            return { countLabel, paginationLabel, cardsCount, buttons };
        })()""", "returnByValue": True})
        
        data = res["result"]["result"]["value"]
        print("Página 1 Inicial:", data)
        assert data["cardsCount"] == 30, f"Expected 30 cards on page 1, got {data['cardsCount']}"
        assert "48 productos" in data["countLabel"], f"Expected 48 in countLabel, got {data['countLabel']}"
        assert "1–30 de 48" in data["paginationLabel"], f"Expected 1–30 in paginationLabel, got {data['paginationLabel']}"
        
        # Verificar botones en página 1
        btn_texts = [b["text"].replace('\n', ' ').strip() for b in data["buttons"]]
        print("Botones en página 1:", btn_texts)
        # Debe haber botón Anterior (deshabilitado), botón 1 (deshabilitado/activo), botón 2 (habilitado), botón Siguiente (habilitado)
        assert any("Anterior" in t or "‹" in t for t in btn_texts), "Falta botón Anterior"
        assert any("Siguiente" in t or "›" in t for t in btn_texts), "Falta botón Siguiente"
        assert "1" in btn_texts, "Falta botón 1"
        assert "2" in btn_texts, "Falta botón 2"
        assert "3" not in btn_texts, "No debe existir botón 3 con 48 items"
        assert "4" not in btn_texts, "No debe existir botón 4 con 48 items"
        
        # Botón anterior debe estar deshabilitado en página 1
        prev_btn = [b for b in data["buttons"] if "Anterior" in b["text"] or "‹" in b["text"]][0]
        assert prev_btn["disabled"] == True, "El botón Anterior debe estar deshabilitado en página 1"
        
        # Botón 1 debe tener clase activa
        btn1 = [b for b in data["buttons"] if b["text"] == "1"][0]
        assert "bg-[#1a3d2f]" in btn1["classes"], f"Botón 1 debe tener estilo activo, got {btn1['classes']}"
        
        # 2. Navegar a Página 2
        print("\n--- TEST: Navegar a Página 2 ---")
        cdp_call("Runtime.evaluate", {"expression": "window.goToPage(2)"})
        time.sleep(0.5)
        
        res = cdp_call("Runtime.evaluate", {"expression": """(() => {
            const paginationLabel = document.getElementById('products-pagination-label')?.textContent || '';
            const cardsCount = document.querySelectorAll('#products-grid > div').length;
            const buttons = Array.from(document.querySelectorAll('#products-pagination-controls button')).map(b => ({
                text: b.textContent.trim(),
                disabled: b.disabled,
                classes: b.className
            }));
            return { paginationLabel, cardsCount, buttons };
        })()""", "returnByValue": True})
        
        data_p2 = res["result"]["result"]["value"]
        print("Página 2:", data_p2)
        assert data_p2["cardsCount"] == 18, f"Expected 18 cards on page 2 (48 - 30), got {data_p2['cardsCount']}"
        assert "31–48 de 48" in data_p2["paginationLabel"], f"Expected 31–48 in paginationLabel, got {data_p2['paginationLabel']}"
        
        # Botón Siguiente debe estar deshabilitado en página 2
        next_btn = [b for b in data_p2["buttons"] if "Siguiente" in b["text"] or "›" in b["text"]][0]
        assert next_btn["disabled"] == True, "El botón Siguiente debe estar deshabilitado en la última página"
        
        # Botón Anterior debe estar habilitado en página 2
        prev_btn_p2 = [b for b in data_p2["buttons"] if "Anterior" in b["text"] or "‹" in b["text"]][0]
        assert prev_btn_p2["disabled"] == False, "El botón Anterior debe estar habilitado en página 2"
        
        # Botón 2 debe tener clase activa
        btn2 = [b for b in data_p2["buttons"] if b["text"] == "2"][0]
        assert "bg-[#1a3d2f]" in btn2["classes"], f"Botón 2 debe tener estilo activo, got {btn2['classes']}"
        
        # 3. Test Reseteo a Página 1 al Cambiar Filtro de Categoría
        print("\n--- TEST: Reseteo al filtrar por Categoría ---")
        cdp_call("Runtime.evaluate", {"expression": "window.setCategoryFilter('canastas')"})
        time.sleep(0.5)
        
        res = cdp_call("Runtime.evaluate", {"expression": """(() => {
            const paginationLabel = document.getElementById('products-pagination-label')?.textContent || '';
            const cardsCount = document.querySelectorAll('#products-grid > div').length;
            const buttons = Array.from(document.querySelectorAll('#products-pagination-controls button')).map(b => ({
                text: b.textContent.trim(),
                disabled: b.disabled
            }));
            return { paginationLabel, cardsCount, buttons };
        })()""", "returnByValue": True})
        
        data_cat = res["result"]["result"]["value"]
        print("Filtro Canastas:", data_cat)
        assert data_cat["cardsCount"] == 4, f"Expected 4 canastas, got {data_cat['cardsCount']}"
        assert "1–4 de 4" in data_cat["paginationLabel"], f"Expected 1–4 de 4, got {data_cat['paginationLabel']}"
        assert len(data_cat["buttons"]) == 1, f"Con 1 página solo debe mostrar botón 1, got {data_cat['buttons']}"
        assert data_cat["buttons"][0]["text"] == "1", "El único botón debe ser 1"
        assert data_cat["buttons"][0]["disabled"] == True, "El botón 1 debe estar deshabilitado"
        
        # 4. Test Reseteo al Limpiar Filtros
        print("\n--- TEST: Reseteo al limpiar filtros ---")
        cdp_call("Runtime.evaluate", {"expression": "window.resetFilters()"})
        time.sleep(0.5)
        
        res = cdp_call("Runtime.evaluate", {"expression": """(() => {
            const cardsCount = document.querySelectorAll('#products-grid > div').length;
            const paginationLabel = document.getElementById('products-pagination-label')?.textContent || '';
            return { cardsCount, paginationLabel };
        })()""", "returnByValue": True})
        data_reset = res["result"]["result"]["value"]
        print("Tras resetFilters:", data_reset)
        assert data_reset["cardsCount"] == 30, f"Debe regresar a 30 cards en página 1, got {data_reset['cardsCount']}"
        assert "1–30 de 48" in data_reset["paginationLabel"]
        
        # 5. Test Reseteo al Buscar
        print("\n--- TEST: Reseteo al Buscar ---")
        cdp_call("Runtime.evaluate", {"expression": "window.goToPage(2)"})
        time.sleep(0.3)
        # Simular input de búsqueda
        cdp_call("Runtime.evaluate", {"expression": """(() => {
            const input = document.getElementById('market-search');
            input.value = 'tomate';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        })()"""})
        time.sleep(0.6) # Esperar debounce de 250ms
        
        res = cdp_call("Runtime.evaluate", {"expression": """(() => {
            const paginationLabel = document.getElementById('products-pagination-label')?.textContent || '';
            const cardsCount = document.querySelectorAll('#products-grid > div').length;
            return { paginationLabel, cardsCount };
        })()""", "returnByValue": True})
        data_search = res["result"]["result"]["value"]
        print("Tras búsqueda 'tomate':", data_search)
        assert data_search["cardsCount"] > 0, "Debe encontrar tomates"
        assert data_search["paginationLabel"].startswith("Mostrando 1–"), f"Debe haber reseteado a página 1, got {data_search['paginationLabel']}"

        print("\n==========================================")
        print("  ¡TODAS LAS PRUEBAS DE PAGINACIÓN PASARON!  ")
        print("==========================================\n")
        
    finally:
        try:
            s.close()
        except:
            pass
        proc.terminate()

if __name__ == "__main__":
    run_pagination_test()
