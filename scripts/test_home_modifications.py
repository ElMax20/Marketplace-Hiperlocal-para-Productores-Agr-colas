import subprocess
import time
import json
import urllib.request
import socket
import base64
import os
import struct
import tempfile

def test_home_modifications():
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
            data = msg_str.encode('utf-8')
            length = len(data)
            frame = bytearray([0x81])
            if length <= 125:
                frame.append(0x80 | length)
            elif length <= 65535:
                frame.append(0x80 | 126)
                frame.extend(struct.pack(">H", length))
            else:
                frame.append(0x80 | 127)
                frame.extend(struct.pack(">Q", length))
            mask = os.urandom(4)
            frame.extend(mask)
            masked_data = bytearray(data[i] ^ mask[i % 4] for i in range(length))
            frame.extend(masked_data)
            s.sendall(frame)

        def recv_frame():
            res = s.recv(2)
            if not res: return None
            b1, b2 = res[0], res[1]
            length = b2 & 0x7F
            if length == 126:
                data = s.recv(2)
                length = struct.unpack(">H", data)[0]
            elif length == 127:
                data = s.recv(8)
                length = struct.unpack(">Q", data)[0]
            payload = bytearray()
            while len(payload) < length:
                chunk = s.recv(length - len(payload))
                if not chunk: break
                payload.extend(chunk)
            return payload.decode('utf-8', errors='ignore')

        msg_id = [1]
        def cdp_call(method, params=None):
            curr_id = msg_id[0]
            msg_id[0] += 1
            cmd = {"id": curr_id, "method": method}
            if params:
                cmd["params"] = params
            send_frame(json.dumps(cmd))
            while True:
                r = recv_frame()
                if not r: return None
                try:
                    data = json.loads(r)
                    if data.get("id") == curr_id:
                        return data.get("result", {})
                except Exception:
                    pass

        # 1. Navegar a index.html
        print("--- Navegando a http://localhost:5500/index.html ---")
        cdp_call("Page.navigate", {"url": "http://localhost:5500/index.html"})
        time.sleep(3)

        # 2. Verificar que 'Reseñas verificadas' fue eliminada por completo
        print("--- 1. Verificando eliminación de 'Reseñas verificadas' ---")
        eval_reviews = cdp_call("Runtime.evaluate", {
            "expression": """
            (() => {
                const bodyText = document.body.innerText;
                const hasTitle = bodyText.includes('Reseñas verificadas');
                const hasPhrase = bodyText.includes('La frescura se comparte');
                const hasReviewImg = document.querySelector('img[src*="review_1.jpg"]') !== null;
                return { hasTitle, hasPhrase, hasReviewImg };
            })()
            """,
            "returnByValue": True
        })
        res_reviews = eval_reviews.get("result", {}).get("value", {})
        print("Reviews check:", res_reviews)
        assert not res_reviews["hasTitle"], "ERROR: 'Reseñas verificadas' aún está presente en el texto del DOM"
        assert not res_reviews["hasPhrase"], "ERROR: 'La frescura se comparte' aún está presente en el DOM"
        assert not res_reviews["hasReviewImg"], "ERROR: review_1.jpg aún está presente en el DOM"
        print("✓ Sección 'Reseñas verificadas' eliminada exitosamente del DOM.")

        # 3. Verificar botón 'Conoce a los agricultores'
        print("--- 2. Verificando botón 'Conoce a los agricultores' ---")
        eval_btn = cdp_call("Runtime.evaluate", {
            "expression": """
            (() => {
                const btn = document.getElementById('btn-hero-agricultores');
                const section = document.getElementById('agricultores');
                return {
                    btnExists: !!btn,
                    btnHref: btn ? btn.getAttribute('href') : null,
                    sectionExists: !!section,
                    sectionId: section ? section.id : null
                };
            })()
            """,
            "returnByValue": True
        })
        res_btn = eval_btn.get("result", {}).get("value", {})
        print("Hero button check:", res_btn)
        assert res_btn["btnExists"], "ERROR: btn-hero-agricultores no encontrado"
        assert res_btn["btnHref"] == "#agricultores", f"ERROR: href esperado '#agricultores', obtenido: {res_btn['btnHref']}"
        assert res_btn["sectionExists"], "ERROR: Sección #agricultores no encontrada"
        print("✓ Botón 'Conoce a los agricultores' configurado con href='#agricultores' y scroll suave.")

        # 4. Verificar 'La cosecha de hoy' inicialmente (sin reseñas)
        print("--- 3. Verificando 'La cosecha de hoy' sin valoraciones ---")
        eval_cosecha_empty = cdp_call("Runtime.evaluate", {
            "expression": """
            (() => {
                const grid = document.getElementById('cosecha-grid');
                const cards = grid ? grid.querySelectorAll('[data-product-id]') : [];
                return {
                    gridExists: !!grid,
                    cardsCount: cards.length,
                    text: grid ? grid.innerText : ''
                };
            })()
            """,
            "returnByValue": True
        })
        res_empty = eval_cosecha_empty.get("result", {}).get("value", {})
        print("Cosecha sin reseñas:", res_empty)
        assert res_empty["gridExists"], "ERROR: #cosecha-grid no encontrado"
        assert res_empty["cardsCount"] == 0, f"ERROR: Se esperaban 0 tarjetas sin reseñas, obtenidas: {res_empty['cardsCount']}"
        print("✓ 'La cosecha de hoy' no muestra tarjetas ficticias cuando no hay valoraciones.")

        # 5. Inyectar 1 valoración real en localStorage (Regla estricta: mostrar SOLO 1 producto)
        print("--- 4. Inyectando 1 valoración real (Regla estricta de cantidad) ---")
        cdp_call("Runtime.evaluate", {
            "expression": """
            (() => {
                // Inyectar 1 reseña de 5 estrellas para Tomate de huerta (id: 1 o tomate-huerta)
                const review = [{
                    id: 'rev-1',
                    name: 'Carlos M.',
                    rating: 5,
                    title: 'Cosecha excepcional',
                    comment: 'Tomates con sabor real de campo.',
                    date: '10 nov. 2026',
                    verified: true
                }];
                localStorage.setItem('product_reviews_1', JSON.stringify(review));
                localStorage.setItem('product_reviews_tomate-huerta', JSON.stringify(review));
                if (typeof window.initCosechaDeHoy === 'function') {
                    window.initCosechaDeHoy();
                }
            })()
            """
        })
        time.sleep(1)

        eval_single = cdp_call("Runtime.evaluate", {
            "expression": """
            (() => {
                const grid = document.getElementById('cosecha-grid');
                const cards = grid ? grid.querySelectorAll('[data-product-id]') : [];
                let cardData = null;
                if (cards.length > 0) {
                    const c = cards[0];
                    cardData = {
                        id: c.getAttribute('data-product-id'),
                        title: c.getAttribute('data-product-title'),
                        price: c.getAttribute('data-product-price'),
                        unit: c.getAttribute('data-product-unit'),
                        text: c.innerText
                    };
                }
                return {
                    cardsCount: cards.length,
                    cardData
                };
            })()
            """,
            "returnByValue": True
        })
        res_single = eval_single.get("result", {}).get("value", {})
        print("Cosecha con 1 reseña:", res_single)
        assert res_single["cardsCount"] == 1, f"ERROR: Regla estricta violada! Se esperaba exactamente 1 tarjeta, obtenidas: {res_single['cardsCount']}"
        assert "Tomate de huerta" in res_single["cardData"]["title"], f"ERROR: Se esperaba 'Tomate de huerta', obtenido: {res_single['cardData']['title']}"
        assert "5.0" in res_single["cardData"]["text"] or "5,0" in res_single["cardData"]["text"], f"ERROR: Se esperaba 5.0 en texto, obtenido: {res_single['cardData']['text']}"
        print("✓ Regla estricta verificada: Con 1 producto valorado, se muestra ÚNICAMENTE 1 producto.")

        # 6. Inyectar segunda y tercera valoración para comprobar ordenamiento DESC
        print("--- 5. Inyectando más valoraciones para comprobar ordenamiento DESC y límite de 4 ---")
        cdp_call("Runtime.evaluate", {
            "expression": """
            (() => {
                // Aguacate Hass: 4.8 estrellas (2 opiniones)
                const revAguacate = [
                    { id: 'rev-2', rating: 5, date: '11 nov. 2026' },
                    { id: 'rev-3', rating: 4.6, date: '11 nov. 2026' }
                ];
                localStorage.setItem('product_reviews_2', JSON.stringify(revAguacate));
                localStorage.setItem('product_reviews_aguacate-hass', JSON.stringify(revAguacate));

                // Zanahoria de tierra: 4.9 estrellas (1 opinión)
                const revZanahoria = [{ id: 'rev-4', rating: 4.9, date: '11 nov. 2026' }];
                localStorage.setItem('product_reviews_3', JSON.stringify(revZanahoria));
                localStorage.setItem('product_reviews_zanahoria-tierra', JSON.stringify(revZanahoria));

                // Fresas: 4.5 estrellas
                const revFresas = [{ id: 'rev-5', rating: 4.5, date: '11 nov. 2026' }];
                localStorage.setItem('product_reviews_4', JSON.stringify(revFresas));
                localStorage.setItem('product_reviews_fresas-temporada', JSON.stringify(revFresas));

                // Miel: 4.2 estrellas (Este sería el 5to, no debe salir porque el tope es 4)
                const revMiel = [{ id: 'rev-6', rating: 4.2, date: '11 nov. 2026' }];
                localStorage.setItem('product_reviews_9', JSON.stringify(revMiel));
                localStorage.setItem('product_reviews_miel-de-abeja-silvestre', JSON.stringify(revMiel));

                if (typeof window.initCosechaDeHoy === 'function') {
                    window.initCosechaDeHoy();
                }
            })()
            """
        })
        time.sleep(1)

        eval_top4 = cdp_call("Runtime.evaluate", {
            "expression": """
            (() => {
                const grid = document.getElementById('cosecha-grid');
                const cards = grid ? Array.from(grid.querySelectorAll('[data-product-id]')) : [];
                return {
                    cardsCount: cards.length,
                    items: cards.map(c => ({
                        id: c.getAttribute('data-product-id'),
                        title: c.getAttribute('data-product-title'),
                        price: c.getAttribute('data-product-price')
                    }))
                };
            })()
            """,
            "returnByValue": True
        })
        res_top4 = eval_top4.get("result", {}).get("value", {})
        print("Cosecha con 5 productos valorados (tope 4):", res_top4)
        assert res_top4["cardsCount"] == 4, f"ERROR: Se esperaban máximo 4 tarjetas, obtenidas: {res_top4['cardsCount']}"
        titles = [item["title"] for item in res_top4["items"]]
        print("Top 4 ordenados:", titles)
        assert titles[0] == "Tomate de huerta", f"ERROR: Primer producto esperado Tomate de huerta (5.0), obtenido: {titles[0]}"
        assert titles[1] == "Zanahoria de tierra", f"ERROR: Segundo producto esperado Zanahoria de tierra (4.9), obtenido: {titles[1]}"
        assert titles[2] == "Aguacate Hass", f"ERROR: Tercer producto esperado Aguacate Hass (4.8), obtenido: {titles[2]}"
        assert titles[3] == "Fresas de temporada", f"ERROR: Cuarto producto esperado Fresas de temporada (4.5), obtenido: {titles[3]}"
        assert "Miel de abeja silvestre" not in titles, "ERROR: El 5to producto mejor valorado NO debió incluirse"
        print("✓ Ordenamiento DESC y límite de 4 productos verificados con precisión.")

        # 7. Limpiar localStorage de prueba
        cdp_call("Runtime.evaluate", {
            "expression": """
            (() => {
                localStorage.removeItem('product_reviews_1');
                localStorage.removeItem('product_reviews_tomate-huerta');
                localStorage.removeItem('product_reviews_2');
                localStorage.removeItem('product_reviews_aguacate-hass');
                localStorage.removeItem('product_reviews_3');
                localStorage.removeItem('product_reviews_zanahoria-tierra');
                localStorage.removeItem('product_reviews_4');
                localStorage.removeItem('product_reviews_fresas-temporada');
                localStorage.removeItem('product_reviews_9');
                localStorage.removeItem('product_reviews_miel-de-abeja-silvestre');
            })()
            """
        })
        print("--- TODOS LOS TESTS PASARON EXITOSAMENTE ---")

    finally:
        try: s.close()
        except: pass
        proc.terminate()
        try: proc.wait(timeout=2)
        except: proc.kill()

if __name__ == '__main__':
    test_home_modifications()
