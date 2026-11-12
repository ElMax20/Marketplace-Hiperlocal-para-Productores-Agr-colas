import subprocess
import time
import json
import urllib.request
import socket
import base64
import os
import struct
import tempfile

def run_test():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    temp_dir = tempfile.mkdtemp()
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        "--remote-debugging-port=9444",
        f"--user-data-dir={temp_dir}",
        "--disable-gpu",
        "--no-sandbox",
        "about:blank"
    ])
    
    time.sleep(2)
    
    try:
        req = urllib.request.urlopen("http://127.0.0.1:9444/json")
        tabs = json.loads(req.read().decode())
        ws_url = tabs[0]["webSocketDebuggerUrl"]
        print("ws_url:", ws_url)
        path = "/" + ws_url.split("/", 3)[3]
        
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("127.0.0.1", 9444))
        
        key = base64.b64encode(os.urandom(16)).decode('utf-8')
        handshake = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: 127.0.0.1:9444\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n\r\n"
        )
        s.sendall(handshake.encode('utf-8'))
        resp = s.recv(4096).decode('utf-8', errors='ignore')
        print("Handshake response:\n", resp)
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
            opcode = b1 & 0x0f
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

        # 1. Test mercado.html
        print("\n--- TEST: mercado.html ---")
        cdp_call("Page.enable")
        cdp_call("Page.navigate", {"url": "http://localhost:5500/mercado.html"})
        time.sleep(2.5) # Wait for page load & loadProductsFromSupabase
        
        # Check products count label
        res = cdp_call("Runtime.evaluate", {"expression": "document.getElementById('products-count-label')?.textContent"})
        count_label = res["result"]["result"].get("value")
        print("products-count-label:", count_label)
        assert "48 productos" in count_label, f"Expected 48 products in label, got {count_label}"
        
        # Check grid items rendered
        res = cdp_call("Runtime.evaluate", {"expression": "document.querySelectorAll('#products-grid > div').length"})
        grid_items = res["result"]["result"].get("value")
        print("Rendered cards in grid:", grid_items)
        assert grid_items == 30, f"Expected 30 cards on page 1, got {grid_items}"
        
        # Check images in grid: none are burger/pizza/broken
        res = cdp_call("Runtime.evaluate", {"expression": """(() => {
            const imgs = Array.from(document.querySelectorAll('#products-grid img'));
            const bad = imgs.filter(img => /burger|hamburguesa|pizza/i.test(img.src));
            return {
                totalImgs: imgs.length,
                badCount: bad.length,
                samples: imgs.slice(0, 3).map(img => img.src)
            };
        })()""", "returnByValue": True})
        img_info = res["result"]["result"]["value"]
        print(f"Product images: total={img_info['totalImgs']}, badCount={img_info['badCount']}")
        print("Sample images:", img_info["samples"])
        assert img_info["badCount"] == 0, "Found bad images!"
        assert img_info["totalImgs"] == 30, f"Expected 30 images on page 1, got {img_info['totalImgs']}"
        
        # Test Modal Open & Scroll Lock in mercado.html
        print("\n--- TEST: Modal Scroll in mercado.html ---")
        res = cdp_call("Runtime.evaluate", {"expression": "document.body.style.overflow"})
        print("Initial body overflow:", repr(res["result"]["result"].get("value")))
        assert res["result"]["result"].get("value") == "", "Initial overflow should be empty"
        
        # Open modal
        cdp_call("Runtime.evaluate", {"expression": "openAuthModal('register')"})
        time.sleep(0.5)
        
        res = cdp_call("Runtime.evaluate", {"expression": "document.body.style.overflow"})
        body_overflow_open = res["result"]["result"].get("value")
        print("Body overflow when modal is OPEN:", repr(body_overflow_open))
        assert body_overflow_open == "hidden", f"Body overflow should be hidden, got {body_overflow_open}"
        
        # Check modal card scroll structure
        res = cdp_call("Runtime.evaluate", {"expression": """(() => {
            const modal = document.getElementById('auth-modal');
            const card = modal.querySelector('.relative.w-full.max-w-md');
            const style = window.getComputedStyle(card);
            return {
                modalHidden: modal.classList.contains('hidden'),
                modalOverlayOverflowY: window.getComputedStyle(modal).overflowY,
                cardMaxHeight: style.maxHeight,
                cardOverflowY: style.overflowY,
                cardScrollHeight: card.scrollHeight,
                cardClientHeight: card.clientHeight,
                isScrollable: card.scrollHeight >= card.clientHeight
            };
        })()""", "returnByValue": True})
        modal_checks = res["result"]["result"]["value"]
        print("Modal inspection:", modal_checks)
        assert not modal_checks["modalHidden"], "Modal should not be hidden"
        assert modal_checks["modalOverlayOverflowY"] == "auto", "Modal overlay should have overflow-y: auto"
        assert modal_checks["cardOverflowY"] == "auto", "Card should have overflow-y: auto"
        assert "vh" in modal_checks["cardMaxHeight"] or "px" in modal_checks["cardMaxHeight"], "Card should have max-height"
        
        # Close modal
        cdp_call("Runtime.evaluate", {"expression": "closeAuthModal()"})
        time.sleep(0.5)
        
        res = cdp_call("Runtime.evaluate", {"expression": "document.body.style.overflow"})
        body_overflow_closed = res["result"]["result"].get("value")
        print("Body overflow when modal is CLOSED:", repr(body_overflow_closed))
        assert body_overflow_closed == "", f"Body overflow should be restored, got {body_overflow_closed}"

        # 2. Test index.html modal
        print("\n--- TEST: index.html register modal ---")
        cdp_call("Page.navigate", {"url": "http://localhost:5500/index.html"})
        time.sleep(2)
        
        # Open register modal
        cdp_call("Runtime.evaluate", {"expression": "openRegisterModal()"})
        time.sleep(0.5)
        
        res = cdp_call("Runtime.evaluate", {"expression": "document.body.style.overflow"})
        body_overflow_index_open = res["result"]["result"].get("value")
        print("Index body overflow when register modal is OPEN:", repr(body_overflow_index_open))
        assert body_overflow_index_open == "hidden", "Expected overflow: hidden on index"
        
        # Check register modal structure
        res = cdp_call("Runtime.evaluate", {"expression": """(() => {
            const modal = document.getElementById('register-auth-modal');
            const card = modal.querySelector('.relative.w-full.max-w-md');
            const style = window.getComputedStyle(card);
            return {
                modalHidden: modal.classList.contains('hidden'),
                modalOverlayOverflowY: window.getComputedStyle(modal).overflowY,
                cardMaxHeight: style.maxHeight,
                cardOverflowY: style.overflowY,
                cardScrollHeight: card.scrollHeight,
                cardClientHeight: card.clientHeight
            };
        })()""", "returnByValue": True})
        index_modal_checks = res["result"]["result"]["value"]
        print("Index register modal inspection:", index_modal_checks)
        assert not index_modal_checks["modalHidden"], "Register modal should be visible"
        assert index_modal_checks["modalOverlayOverflowY"] == "auto", "Register modal overlay overflow-y should be auto"
        assert index_modal_checks["cardOverflowY"] == "auto", "Card overflow-y should be auto"
        
        # Close register modal
        cdp_call("Runtime.evaluate", {"expression": "closeRegisterModal()"})
        time.sleep(0.5)
        
        res = cdp_call("Runtime.evaluate", {"expression": "document.body.style.overflow"})
        body_overflow_index_closed = res["result"]["result"].get("value")
        print("Index body overflow when modal is CLOSED:", repr(body_overflow_index_closed))
        assert body_overflow_index_closed == "", "Expected overflow: '' on index after close"

        print("\n==========================================")
        print(">>> ALL AUDITS & TESTS PASSED WITH 100% SUCCESS! <<<")
        print("==========================================")
        
    finally:
        proc.terminate()

if __name__ == '__main__':
    run_test()
