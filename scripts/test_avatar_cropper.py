import subprocess
import time
import json
import urllib.request
import socket
import base64
import os
import struct
import tempfile

def test_cropper():
    temp_dir = tempfile.mkdtemp()
    proc = subprocess.Popen([
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        '--headless=new',
        '--remote-debugging-port=9666',
        f'--user-data-dir={temp_dir}',
        '--disable-gpu',
        '--no-sandbox',
        'about:blank'
    ])
    time.sleep(2.5)
    try:
        req = urllib.request.urlopen('http://127.0.0.1:9666/json')
        tabs = json.loads(req.read().decode())
        ws_url = tabs[0]['webSocketDebuggerUrl']
        path = '/' + ws_url.split('/', 3)[3]
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(('127.0.0.1', 9666))
        key = base64.b64encode(os.urandom(16)).decode('utf-8')
        s.sendall(f'GET {path} HTTP/1.1\r\nHost: 127.0.0.1:9666\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'.encode('utf-8'))
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

        print("\n--- TEST: perfil.html Avatar Cropper ---")
        call('Page.enable')

        # Pre-seed localStorage before navigation to prevent redirect to mercado.html
        call('Page.addScriptToEvaluateOnNewDocument', {'source': """
            const testUser = {
                id: '00000000-0000-0000-0000-000000000001',
                username: 'max',
                name: 'Max Campoverde',
                email: 'max@vecinos.com',
                phone: '0991234567',
                role: 'cliente',
                avatar: null,
                loggedIn: true
            };
            localStorage.setItem('rb_current_user', JSON.stringify(testUser));
            localStorage.setItem('raiz_user', JSON.stringify(testUser));
            localStorage.setItem('rb_cached_profile', JSON.stringify({
                id: testUser.id,
                full_name: testUser.name,
                avatar_url: null,
                role: 'cliente',
                username: testUser.username
            }));
        """})

        call('Page.navigate', {'url': 'http://localhost:5500/perfil.html'})
        time.sleep(2.5)

        # Verify page URL and logged in user
        res = call('Runtime.evaluate', {'expression': 'window.location.href', 'returnByValue': True})
        print("Page URL:", res["result"]["result"]["value"])
        assert "perfil.html" in res["result"]["result"]["value"], "Page should stay on perfil.html!"

        # 1. Simulate selecting an image file and opening the cropper modal
        res = call('Runtime.evaluate', {'expression': """(async () => {
            // Create a test 600x600 image on a scratch canvas
            const c = document.createElement('canvas');
            c.width = 600;
            c.height = 600;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#1a3d2f';
            ctx.fillRect(0, 0, 600, 600);
            ctx.fillStyle = '#e2725b';
            ctx.beginPath();
            ctx.arc(300, 300, 150, 0, Math.PI * 2);
            ctx.fill();

            const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9));
            const file = new File([blob], 'test_avatar.jpg', { type: 'image/jpeg' });

            // Call openAvatarCropperModal
            openAvatarCropperModal(file);
            return true;
        })()""", 'awaitPromise': True})
        print("Opened cropper modal:", res["result"]["result"].get("value"))
        time.sleep(1)

        # 2. Check modal visibility, elements, and body scroll lock
        res = call('Runtime.evaluate', {'expression': """(() => {
            const modal = document.getElementById('avatar-cropper-modal');
            const viewport = document.getElementById('cropper-viewport');
            const canvas = document.getElementById('cropper-canvas');
            const mask = viewport?.querySelector('.rounded-full.ring-4.ring-white.shadow-lg');
            const slider = document.getElementById('cropper-zoom-slider');
            const saveBtn = document.getElementById('cropper-save-btn');

            return {
                modalVisible: modal && !modal.classList.contains('hidden'),
                bodyOverflow: document.body.style.overflow,
                viewportWidth: viewport ? viewport.offsetWidth : 0,
                viewportHeight: viewport ? viewport.offsetHeight : 0,
                canvasWidth: canvas ? canvas.width : 0,
                canvasHeight: canvas ? canvas.height : 0,
                hasMaskOverlay: !!mask,
                sliderMin: slider ? slider.min : '',
                sliderMax: slider ? slider.max : '',
                sliderStep: slider ? slider.step : '',
                saveBtnText: saveBtn ? saveBtn.textContent.trim() : ''
            };
        })()""", 'returnByValue': True})
        info = res["result"]["result"]["value"]
        print("Cropper modal inspection:", info)
        assert info["modalVisible"], "Modal should be visible!"
        assert info["bodyOverflow"] == "hidden", "Body scroll should be locked (overflow: hidden)!"
        assert info["viewportWidth"] == 280 and info["viewportHeight"] == 280, f"Viewport should be 280x280, got {info['viewportWidth']}x{info['viewportHeight']}"
        assert info["canvasWidth"] == 280 and info["canvasHeight"] == 280, "Canvas should be 280x280"
        assert info["hasMaskOverlay"], "Mask overlay with rounded-full ring-4 ring-white shadow-lg should exist!"
        assert info["sliderMin"] == "1" and info["sliderMax"] == "3" and info["sliderStep"] == "0.05", "Slider should have min=1, max=3, step=0.05"
        assert "Guardar foto" in info["saveBtnText"], f"Save button text should be 'Guardar foto', got {info['saveBtnText']}"

        # 3. Test Zoom Controls (Buttons & Slider)
        print("\n--- TEST: Zoom Buttons & Slider ---")
        call('Runtime.evaluate', {'expression': """(() => {
            const zoomInBtn = document.getElementById('cropper-zoom-in-btn');
            zoomInBtn.click();
            zoomInBtn.click(); // +0.2 zoom => 1.2
        })()"""})
        time.sleep(0.3)

        res = call('Runtime.evaluate', {'expression': """(() => {
            return {
                zoom: cropperState.zoom,
                label: document.getElementById('cropper-zoom-label')?.textContent
            };
        })()""", 'returnByValue': True})
        zoom_btn_info = res["result"]["result"]["value"]
        print("After clicking Zoom In twice:", zoom_btn_info)
        assert zoom_btn_info["zoom"] >= 1.19, f"Zoom should have increased, got {zoom_btn_info['zoom']}"

        # Test Slider directly to 1.75
        call('Runtime.evaluate', {'expression': """(() => {
            const slider = document.getElementById('cropper-zoom-slider');
            slider.value = "1.75";
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        })()"""})
        time.sleep(0.3)

        res = call('Runtime.evaluate', {'expression': """(() => {
            return {
                zoom: cropperState.zoom,
                label: document.getElementById('cropper-zoom-label')?.textContent
            };
        })()""", 'returnByValue': True})
        zoom_slider_info = res["result"]["result"]["value"]
        print("After slider set to 1.75:", zoom_slider_info)
        assert abs(zoom_slider_info["zoom"] - 1.75) < 0.05, f"Zoom should be ~1.75, got {zoom_slider_info['zoom']}"

        # 4. Test Dragging via Mouse Events (Now at zoom=1.75, maxPanX=(240*1.75/2 - 120)=90px)
        print("\n--- TEST: Dragging (Mouse) ---")
        res = call('Runtime.evaluate', {'expression': """(() => {
            const viewport = document.getElementById('cropper-viewport');
            const rect = viewport.getBoundingClientRect();
            const startX = rect.left + 140;
            const startY = rect.top + 140;

            // Trigger mousedown
            viewport.dispatchEvent(new MouseEvent('mousedown', {
                clientX: startX,
                clientY: startY,
                bubbles: true
            }));

            // Trigger mousemove to drag right (+40) and down (+30)
            window.dispatchEvent(new MouseEvent('mousemove', {
                clientX: startX + 40,
                clientY: startY + 30,
                bubbles: true
            }));

            // Trigger mouseup
            window.dispatchEvent(new MouseEvent('mouseup', {
                clientX: startX + 40,
                clientY: startY + 30,
                bubbles: true
            }));

            return {
                panX: cropperState.panX,
                panY: cropperState.panY,
                zoom: cropperState.zoom
            };
        })()""", 'returnByValue': True})
        drag_info = res["result"]["result"]["value"]
        print("After Mouse Drag at zoom 1.75:", drag_info)
        assert drag_info['panX'] != 0 or drag_info['panY'] != 0, f"Pan should have shifted! got {drag_info}"
        print(f"Pan after mouse drag: panX={drag_info['panX']}, panY={drag_info['panY']}")

        # 5. Test Touch Drag
        print("\n--- TEST: Touch Drag ---")
        res = call('Runtime.evaluate', {'expression': """(() => {
            const viewport = document.getElementById('cropper-viewport');
            const rect = viewport.getBoundingClientRect();
            const startX = rect.left + 140;
            const startY = rect.top + 140;

            const touchObj1 = new Touch({
                identifier: 1,
                target: viewport,
                clientX: startX,
                clientY: startY
            });

            viewport.dispatchEvent(new TouchEvent('touchstart', {
                touches: [touchObj1],
                targetTouches: [touchObj1],
                changedTouches: [touchObj1],
                bubbles: true,
                cancelable: true
            }));

            const touchObj2 = new Touch({
                identifier: 1,
                target: viewport,
                clientX: startX - 30,
                clientY: startY - 20
            });

            viewport.dispatchEvent(new TouchEvent('touchmove', {
                touches: [touchObj2],
                targetTouches: [touchObj2],
                changedTouches: [touchObj2],
                bubbles: true,
                cancelable: true
            }));

            viewport.dispatchEvent(new TouchEvent('touchend', {
                touches: [],
                targetTouches: [],
                changedTouches: [touchObj2],
                bubbles: true
            }));

            return {
                panX: cropperState.panX,
                panY: cropperState.panY
            };
        })()""", 'returnByValue': True})
        touch_info = res["result"]["result"]["value"]
        print("After Touch Drag:", touch_info)

        # 6. Test "Guardar foto" / saveCroppedAvatar()
        print("\n--- TEST: Guardar foto (Canvas 400x400, Blob WebP, Supabase Storage) ---")
        res = call('Runtime.evaluate', {'expression': """(async () => {
            const saveBtn = document.getElementById('cropper-save-btn');
            await saveCroppedAvatar();
            return {
                modalClosed: document.getElementById('avatar-cropper-modal').classList.contains('hidden'),
                bodyOverflowAfterSave: document.body.style.overflow,
                cachedProfile: JSON.parse(localStorage.getItem('rb_cached_profile') || '{}'),
                navAvatarSrc: (document.getElementById('nav-user-avatar') || document.querySelector('#user-avatar-btn img'))?.src || '',
                profileAvatarSrc: document.getElementById('profile-avatar-preview')?.src || ''
            };
        })()""", 'awaitPromise': True, 'returnByValue': True})
        save_result = res["result"]["result"]["value"]
        print("Save result inspection:", save_result)
        assert save_result["modalClosed"], "Modal should be closed after saving!"
        assert save_result["bodyOverflowAfterSave"] == "", "Body scroll should be restored ('') after closing modal!"
        assert save_result["cachedProfile"].get("avatar_url"), "rb_cached_profile should have new avatar_url!"
        assert save_result["profileAvatarSrc"], "Profile preview avatar src should be set!"
        assert save_result["navAvatarSrc"] == save_result["profileAvatarSrc"], f"Navbar ({save_result['navAvatarSrc']}) and profile avatar ({save_result['profileAvatarSrc']}) should match!"
        assert "data:image/webp" in save_result["cachedProfile"]["avatar_url"] or "supabase.co" in save_result["cachedProfile"]["avatar_url"], "Avatar URL should be valid WebP or Supabase Storage URL!"

        print("\n==========================================")
        print(">>> ALL AVATAR CROPPER TESTS PASSED 100%! <<<")
        print("==========================================")
    finally:
        proc.terminate()

if __name__ == '__main__':
    test_cropper()
