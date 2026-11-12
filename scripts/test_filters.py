import subprocess
import time
import json
import urllib.request
import socket
import base64
import os
import struct
import tempfile

def test_filters():
    temp_dir = tempfile.mkdtemp()
    proc = subprocess.Popen([
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        '--headless=new',
        '--remote-debugging-port=9555',
        f'--user-data-dir={temp_dir}',
        '--disable-gpu',
        '--no-sandbox',
        'http://localhost:5500/mercado.html'
    ])
    time.sleep(2.5)
    try:
        req = urllib.request.urlopen('http://127.0.0.1:9555/json')
        tabs = json.loads(req.read().decode())
        ws_url = tabs[0]['webSocketDebuggerUrl']
        path = '/' + ws_url.split('/', 3)[3]
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(('127.0.0.1', 9555))
        key = base64.b64encode(os.urandom(16)).decode('utf-8')
        s.sendall(f'GET {path} HTTP/1.1\r\nHost: 127.0.0.1:9555\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'.encode('utf-8'))
        s.recv(4096)

        msg_id = 0
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

        def call(method, params=None):
            nonlocal msg_id
            msg_id += 1
            cmd = {'id': msg_id, 'method': method, 'params': params or {}}
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

        # Filter 'canastas'
        call('Runtime.evaluate', {'expression': 'setCategoryFilter("canastas")'})
        time.sleep(0.5)
        res = call('Runtime.evaluate', {'expression': 'document.querySelectorAll("#products-grid > div").length'})
        canastas_count = res['result']['result'].get('value')
        print('Canastas filter count:', canastas_count)
        assert canastas_count == 4, f'Expected 4 canastas, got {canastas_count}'

        # Filter 'verduras'
        call('Runtime.evaluate', {'expression': 'setCategoryFilter("verduras")'})
        time.sleep(0.5)
        res = call('Runtime.evaluate', {'expression': 'document.querySelectorAll("#products-grid > div").length'})
        verduras_count = res['result']['result'].get('value')
        print('Verduras filter count:', verduras_count)
        assert verduras_count == 15, f'Expected 15 verduras, got {verduras_count}'

        # Filter 'frutas'
        call('Runtime.evaluate', {'expression': 'setCategoryFilter("frutas")'})
        time.sleep(0.5)
        res = call('Runtime.evaluate', {'expression': 'document.querySelectorAll("#products-grid > div").length'})
        frutas_count = res['result']['result'].get('value')
        print('Frutas filter count:', frutas_count)
        assert frutas_count == 14, f'Expected 14 frutas, got {frutas_count}'

        # Filter 'lacteos'
        call('Runtime.evaluate', {'expression': 'setCategoryFilter("lacteos")'})
        time.sleep(0.5)
        res = call('Runtime.evaluate', {'expression': 'document.querySelectorAll("#products-grid > div").length'})
        lacteos_count = res['result']['result'].get('value')
        print('Lácteos filter count:', lacteos_count)
        assert lacteos_count == 8, f'Expected 8 lacteos, got {lacteos_count}'

        # Filter 'despensa'
        call('Runtime.evaluate', {'expression': 'setCategoryFilter("despensa")'})
        time.sleep(0.5)
        res = call('Runtime.evaluate', {'expression': 'document.querySelectorAll("#products-grid > div").length'})
        despensa_count = res['result']['result'].get('value')
        print('Despensa filter count:', despensa_count)
        assert despensa_count == 7, f'Expected 7 despensa, got {despensa_count}'

        # Reset
        call('Runtime.evaluate', {'expression': 'resetFilters()'})
        time.sleep(0.5)
        res = call('Runtime.evaluate', {'expression': 'document.querySelectorAll("#products-grid > div").length'})
        total_count = res['result']['result'].get('value')
        print('Total after reset:', total_count)
        assert total_count == 48, f'Expected 48 total, got {total_count}'

        print('ALL CATEGORY FILTERS FUNCTION PERFECTLY!')
    finally:
        proc.terminate()

if __name__ == '__main__':
    test_filters()
