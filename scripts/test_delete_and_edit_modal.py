import socket
import os
import subprocess
import time
import json
import urllib.request
import base64
import struct

class SimpleWebSocket:
    def __init__(self, ws_url):
        parts = ws_url.replace("ws://", "").split("/", 1)
        host_port = parts[0].split(":")
        self.host = host_port[0]
        self.port = int(host_port[1])
        self.path = "/" + parts[1]
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((self.host, self.port))
        self._handshake()
        self.msg_id = 0
        self.messages = []

    def _handshake(self):
        key = base64.b64encode(os.urandom(16)).decode('utf-8')
        req = (
            f"GET {self.path} HTTP/1.1\r\n"
            f"Host: {self.host}:{self.port}\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(req.encode('utf-8'))
        resp = b""
        while b"\r\n\r\n" not in resp:
            resp += self.sock.recv(4096)

    def send(self, method, params=None):
        self.msg_id += 1
        msg = {"id": self.msg_id, "method": method}
        if params:
            msg["params"] = params
        payload = json.dumps(msg).encode('utf-8')
        
        length = len(payload)
        mask = os.urandom(4)
        if length <= 125:
            header = bytes([0x81, 0x80 | length]) + mask
        elif length <= 65535:
            header = bytes([0x81, 0x80 | 126]) + struct.pack("!H", length) + mask
        else:
            header = bytes([0x81, 0x80 | 127]) + struct.pack("!Q", length) + mask
        
        masked_payload = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        self.sock.sendall(header + masked_payload)
        return self.msg_id

    def recv(self, timeout=5):
        self.sock.settimeout(timeout)
        try:
            head = self.sock.recv(2)
            if not head:
                return None
            length = head[1] & 0x7F
            if length == 126:
                data = self.sock.recv(2)
                length = struct.unpack("!H", data)[0]
            elif length == 127:
                data = self.sock.recv(8)
                length = struct.unpack("!Q", data)[0]
            
            payload = b""
            while len(payload) < length:
                payload += self.sock.recv(length - len(payload))
            msg = json.loads(payload.decode('utf-8'))
            self.messages.append(msg)
            return msg
        except socket.timeout:
            return None

    def call(self, method, params=None, timeout=10):
        target_id = self.send(method, params)
        start = time.time()
        while time.time() - start < timeout:
            res = self.recv(timeout=1)
            if res and res.get("id") == target_id:
                return res
        return None

    def close(self):
        self.sock.close()

def run_tests():
    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    user_data = os.path.join(os.environ['TEMP'], 'chrome_test_profile_modals2')
    proc = subprocess.Popen([
        chrome_path,
        '--headless=new',
        '--remote-debugging-port=9229',
        f'--user-data-dir={user_data}',
        'http://localhost:5500/productor.html'
    ])
    time.sleep(2.5)
    try:
        tabs = json.loads(urllib.request.urlopen('http://127.0.0.1:9229/json').read().decode())
        target_tab = [t for t in tabs if 'productor.html' in t.get('url', '')][0]
        
        ws = SimpleWebSocket(target_tab['webSocketDebuggerUrl'])
        ws.call("Runtime.enable")
        ws.call("Log.enable")
        
        # Esperar a que producerProducts esté cargado
        start = time.time()
        loaded = False
        while time.time() - start < 10:
            res = ws.call("Runtime.evaluate", {
                "expression": "producerProducts.length",
                "returnByValue": True
            })
            count = res.get("result", {}).get("result", {}).get("value", 0)
            if count and count > 0:
                loaded = True
                break
            time.sleep(0.5)

        print(f"Products loaded in page? {loaded} (count: {count})")
        
        # Test 1: Check Global Modal Functions
        res = ws.call("Runtime.evaluate", {
            "expression": """JSON.stringify({
                hasEditModalFunc: typeof window.openEditProductModal === 'function',
                hasCloseEditModalFunc: typeof window.closeEditProductModal === 'function',
                hasSaveEditedFunc: typeof window.saveEditedProductModal === 'function',
                hasDeleteModalFunc: typeof window.openDeleteProductModal === 'function',
                hasCloseDeleteModalFunc: typeof window.closeDeleteProductModal === 'function',
                hasConfirmDeleteFunc: typeof window.confirmDeleteProduct === 'function',
                editModalElExists: !!document.getElementById('edit-product-modal'),
                deleteModalElExists: !!document.getElementById('delete-product-modal'),
                cardsCount: producerProducts.length
            })""",
            "returnByValue": True
        })
        print("Test 1: Global definitions & DOM elements:")
        print("  ->", res.get("result", {}).get("result", {}).get("value"))

        # Test 2: Check buttons in rendered cards
        res = ws.call("Runtime.evaluate", {
            "expression": """(() => {
                const grid = document.getElementById('producer-products-grid');
                const hasModificarBtn = grid ? grid.innerHTML.includes('openEditProductModal') : false;
                const hasEliminarBtn = grid ? grid.innerHTML.includes('openDeleteProductModal') : false;
                const deleteBtns = grid ? grid.querySelectorAll("button[onclick*='openDeleteProductModal']").length : 0;
                const editBtns = grid ? grid.querySelectorAll("button[onclick*='openEditProductModal']").length : 0;
                return JSON.stringify({ hasModificarBtn, hasEliminarBtn, deleteBtns, editBtns });
            })()""",
            "returnByValue": True
        })
        print("Test 2: Cards action buttons rendered:")
        print("  ->", res.get("result", {}).get("result", {}).get("value"))

        # Test 3: Open Edit Modal on the first product
        res = ws.call("Runtime.evaluate", {
            "expression": """(() => {
                const firstProd = producerProducts[0];
                openEditProductModal(firstProd.code);
                const modal = document.getElementById('edit-product-modal');
                const isVisible = modal && !modal.classList.contains('hidden');
                const nameVal = document.getElementById('edit-modal-name')?.value;
                const priceVal = document.getElementById('edit-modal-price')?.value;
                const stockVal = document.getElementById('edit-modal-stock')?.value;
                const codeBadge = document.getElementById('edit-modal-code-badge')?.textContent.trim();
                const previewSrc = document.getElementById('edit-modal-image-preview')?.src;
                
                return JSON.stringify({
                    targetCode: firstProd.code,
                    isVisible,
                    nameVal,
                    priceVal,
                    stockVal,
                    codeBadge,
                    hasPreviewImage: Boolean(previewSrc && previewSrc.length > 5)
                });
            })()""",
            "returnByValue": True
        })
        print("Test 3: Edit Modal opening & pre-population:")
        print("  ->", res.get("result", {}).get("result", {}).get("value"))

        # Test 4: Edit fields and save changes via modal
        res = ws.call("Runtime.evaluate", {
            "expression": """(async () => {
                const firstProd = producerProducts[0];
                document.getElementById('edit-modal-name').value = 'Rábanos Daikon Selección Especial';
                document.getElementById('edit-modal-price').value = '3.50';
                document.getElementById('edit-modal-stock').value = '80';
                
                await saveEditedProductModal();
                
                const modal = document.getElementById('edit-product-modal');
                const isHiddenAfterSave = modal && modal.classList.contains('hidden');
                
                const updated = producerProducts.find(p => p.code === firstProd.code);
                const grid = document.getElementById('producer-products-grid');
                const hasUpdatedTitleInDOM = grid.innerHTML.includes('Rábanos Daikon Selección Especial');
                const hasUpdatedPriceInDOM = grid.innerHTML.includes('3.50');
                const hasUpdatedStockInDOM = grid.innerHTML.includes('80');
                
                return JSON.stringify({
                    isHiddenAfterSave,
                    updatedTitle: updated?.title,
                    updatedPrice: updated?.price,
                    updatedStock: updated?.stock,
                    hasUpdatedTitleInDOM,
                    hasUpdatedPriceInDOM,
                    hasUpdatedStockInDOM
                });
            })()""",
            "awaitPromise": True,
            "returnByValue": True
        }, timeout=15)
        print("Test 4: Edit Modal save & DOM update:")
        print("  ->", res.get("result", {}).get("result", {}).get("value"))

        # Test 5: Open Delete Modal
        res = ws.call("Runtime.evaluate", {
            "expression": """(() => {
                const firstProd = producerProducts[0];
                openDeleteProductModal(firstProd.code);
                const modal = document.getElementById('delete-product-modal');
                const isVisible = modal && !modal.classList.contains('hidden');
                const nameDisplay = document.getElementById('delete-modal-product-name')?.textContent;
                const codeDisplay = document.getElementById('delete-modal-product-code')?.textContent;
                
                return JSON.stringify({
                    isVisible,
                    nameDisplay,
                    codeDisplay,
                    matchesTarget: nameDisplay === firstProd.title && codeDisplay === firstProd.code
                });
            })()""",
            "returnByValue": True
        })
        print("Test 5: Delete Confirmation Modal opening:")
        print("  ->", res.get("result", {}).get("result", {}).get("value"))

        # Test 6: Cancel Delete
        res = ws.call("Runtime.evaluate", {
            "expression": """(() => {
                closeDeleteProductModal();
                const modal = document.getElementById('delete-product-modal');
                return JSON.stringify({ isHidden: modal && modal.classList.contains('hidden') });
            })()""",
            "returnByValue": True
        })
        print("Test 6: Cancel Delete:")
        print("  ->", res.get("result", {}).get("result", {}).get("value"))

        # Test 7: Confirm Delete of a test product
        res = ws.call("Runtime.evaluate", {
            "expression": """(async () => {
                const testCode = 'PR-DEL-999';
                const testProd = {
                    id: 99999,
                    numericId: 99999,
                    code: testCode,
                    title: 'Producto Para Prueba de Eliminación Rápida',
                    description: 'Prueba unitaria',
                    price: 1.00,
                    stock: 10,
                    unit: 'Kilogramo (kg)',
                    unitLabel: 'kg',
                    origin: 'Hacienda San José',
                    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
                    category: 'Verduras & Raíces',
                    status: 'publicado',
                    statusText: 'Publicado',
                    is_available: true
                };
                producerProducts.unshift(testProd);
                renderProducerProducts();
                
                const countBefore = producerProducts.length;
                openDeleteProductModal(testCode);
                await confirmDeleteProduct();
                
                const countAfter = producerProducts.length;
                const stillExists = producerProducts.some(p => p.code === testCode);
                const grid = document.getElementById('producer-products-grid');
                const existsInDOM = grid.innerHTML.includes('Producto Para Prueba de Eliminación Rápida');
                
                return JSON.stringify({
                    deletedFromMemory: !stillExists,
                    deletedFromDOM: !existsInDOM,
                    countDiff: countBefore - countAfter
                });
            })()""",
            "awaitPromise": True,
            "returnByValue": True
        }, timeout=15)
        print("Test 7: Confirm Delete execution & DOM removal:")
        print("  ->", res.get("result", {}).get("result", {}).get("value"))

        ws.close()
    finally:
        proc.terminate()

if __name__ == '__main__':
    run_tests()
