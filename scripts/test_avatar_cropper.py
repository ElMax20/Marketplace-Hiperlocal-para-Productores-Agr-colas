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

        print("\n==========================================")
        print(">>> INICIANDO TEST COMPLETO DE PERFIL & CROPPER <<<")
        print("==========================================")
        call('Page.enable')

        # Pre-seed localStorage with user 'Max Campoverde' without photo
        script_res = call('Page.addScriptToEvaluateOnNewDocument', {'source': """
            const testUser = {
                id: '00000000-0000-0000-0000-000000000001',
                username: 'max',
                name: 'Max Campoverde',
                email: 'max@vecinos.com',
                phone: '0991234567',
                role: 'cliente',
                avatar: null,
                avatar_url: null,
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
        script_id = script_res.get('result', {}).get('identifier')

        call('Page.navigate', {'url': 'http://localhost:5500/perfil.html'})
        time.sleep(2.5)

        # 1. TEST NAVBAR AVATAR WITHOUT PHOTO
        print("\n--- TEST 1: Navbar Avatar Centrado con Iniciales (Sin Foto) ---")
        res = call('Runtime.evaluate', {'expression': """(() => {
            const avatarContainer = document.querySelector('#user-avatar-btn > div');
            const img = document.getElementById('nav-user-avatar');
            const initials = document.getElementById('nav-user-initials');

            return {
                containerClass: avatarContainer ? avatarContainer.className : '',
                imgHidden: img ? img.classList.contains('hidden') : false,
                imgClass: img ? img.className : '',
                initialsVisible: initials ? !initials.classList.contains('hidden') : false,
                initialsText: initials ? initials.textContent.trim() : '',
                initialsClass: initials ? initials.className : ''
            };
        })()""", 'returnByValue': True})
        nav_info = res["result"]["result"]["value"]
        print("Navbar Avatar info:", nav_info)
        assert "bg-emerald-900" in nav_info["containerClass"], "Container must have bg-emerald-900!"
        assert "w-10 h-10 rounded-full" in nav_info["containerClass"], "Container must be w-10 h-10 rounded-full!"
        assert "flex items-center justify-center" in nav_info["containerClass"], "Container must be flex items-center justify-center!"
        assert nav_info["imgHidden"], "Image should be hidden when user has no photo!"
        assert nav_info["initialsVisible"], "Initials should be visible when user has no photo!"
        assert nav_info["initialsText"] in ["M", "MC"], f"Initials should be 'M' or 'MC', got '{nav_info['initialsText']}'"
        assert "flex items-center justify-center w-full h-full text-white font-bold" in nav_info["initialsClass"], "Initials must be centered with flex items-center justify-center w-full h-full!"

        # 2. TEST MODAL OPENING VIA FILE INPUT
        print("\n--- TEST 2: Apertura de Modal 'Ajustar encuadre de la foto' ---")
        res = call('Runtime.evaluate', {'expression': """(async () => {
            // Generate real test portrait image
            const c = document.createElement('canvas');
            c.width = 600;
            c.height = 600;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#064e3b';
            ctx.fillRect(0, 0, 600, 600);
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(300, 300, 180, 0, Math.PI * 2);
            ctx.fill();

            const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9));
            const file = new File([blob], 'avatar_test.jpg', { type: 'image/jpeg' });

            // Trigger file selection
            const input = document.getElementById('photo-file-input');
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        })()""", 'awaitPromise': True})
        time.sleep(1)

        res = call('Runtime.evaluate', {'expression': """(() => {
            const modal = document.getElementById('avatar-cropper-modal');
            const viewport = document.getElementById('cropper-viewport');
            const cropperImg = document.getElementById('cropper-image');
            const mask = viewport?.querySelector('.rounded-full.ring-4.ring-white');
            const pill = viewport?.querySelector('div[class*="bg-black"]');
            const slider = document.getElementById('cropper-zoom-slider');
            const closeBtn = document.getElementById('cropper-close-btn');
            const cancelBtn = document.getElementById('cropper-cancel-btn');
            const saveBtn = document.getElementById('cropper-save-btn');

            return {
                modalVisible: modal && !modal.classList.contains('hidden'),
                bodyOverflow: document.body.style.overflow,
                hasImage: !!cropperImg && !!cropperImg.src,
                imageTransform: cropperImg ? cropperImg.style.transform : '',
                maskPointerEventsNone: mask ? mask.classList.contains('pointer-events-none') : false,
                pillPointerEventsNone: pill ? pill.classList.contains('pointer-events-none') : false,
                hasButtons: !!closeBtn && !!cancelBtn && !!saveBtn && !!slider
            };
        })()""", 'returnByValue': True})
        modal_info = res["result"]["result"]["value"]
        print("Cropper modal opened:", modal_info)
        assert modal_info["modalVisible"], "Modal must be visible!"
        assert modal_info["bodyOverflow"] == "hidden", "Body overflow must be hidden!"
        assert modal_info["hasImage"], "Cropper image must have src!"
        assert modal_info["maskPointerEventsNone"], "Mask must have pointer-events-none!"
        assert modal_info["pillPointerEventsNone"], "Pill must have pointer-events-none!"
        assert modal_info["hasButtons"], "All buttons (close, cancel, save, slider) must exist!"

        # 3. TEST ZOOM CONTROLS (+ button, - button, slider)
        print("\n--- TEST 3: Controles de Zoom (+, -, slider) ---")
        # Click + button twice (+0.2)
        call('Runtime.evaluate', {'expression': """(() => {
            const zoomIn = document.getElementById('cropper-zoom-in-btn');
            zoomIn.click();
            zoomIn.click();
        })()"""})
        time.sleep(0.3)
        res = call('Runtime.evaluate', {'expression': """(() => {
            return {
                zoom: cropperState.zoom,
                label: document.getElementById('cropper-zoom-label')?.textContent.trim(),
                sliderVal: document.getElementById('cropper-zoom-slider')?.value
            };
        })()""", 'returnByValue': True})
        zoom_in_info = res["result"]["result"]["value"]
        print("After + clicks:", zoom_in_info)
        assert abs(zoom_in_info["zoom"] - 1.2) < 0.05, f"Zoom should be 1.2, got {zoom_in_info['zoom']}"
        assert "120%" in zoom_in_info["label"], f"Label should be 120%, got {zoom_in_info['label']}"

        # Click - button once (-0.1)
        call('Runtime.evaluate', {'expression': """(() => {
            const zoomOut = document.getElementById('cropper-zoom-out-btn');
            zoomOut.click();
        })()"""})
        time.sleep(0.3)
        res = call('Runtime.evaluate', {'expression': """(() => {
            return {
                zoom: cropperState.zoom,
                label: document.getElementById('cropper-zoom-label')?.textContent.trim()
            };
        })()""", 'returnByValue': True})
        zoom_out_info = res["result"]["result"]["value"]
        print("After - click:", zoom_out_info)
        assert abs(zoom_out_info["zoom"] - 1.1) < 0.05, f"Zoom should be 1.1, got {zoom_out_info['zoom']}"
        assert "110%" in zoom_out_info["label"], f"Label should be 110%, got {zoom_out_info['label']}"

        # Set slider to 1.75
        call('Runtime.evaluate', {'expression': """(() => {
            const slider = document.getElementById('cropper-zoom-slider');
            slider.value = "1.75";
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        })()"""})
        time.sleep(0.3)
        res = call('Runtime.evaluate', {'expression': """(() => {
            return {
                zoom: cropperState.zoom,
                label: document.getElementById('cropper-zoom-label')?.textContent.trim()
            };
        })()""", 'returnByValue': True})
        slider_info = res["result"]["result"]["value"]
        print("After slider to 1.75:", slider_info)
        assert abs(slider_info["zoom"] - 1.75) < 0.05, f"Zoom should be 1.75, got {slider_info['zoom']}"
        assert "175%" in slider_info["label"], f"Label should be 175%, got {slider_info['label']}"

        # 4. TEST DRAGGING WITH MOUSE & TOUCH
        print("\n--- TEST 4: Arrastre Mouse & Touch en Tiempo Real ---")
        res = call('Runtime.evaluate', {'expression': """(() => {
            const viewport = document.getElementById('cropper-viewport');
            const rect = viewport.getBoundingClientRect();
            const startX = rect.left + 140;
            const startY = rect.top + 140;

            // Mouse Drag
            viewport.dispatchEvent(new MouseEvent('mousedown', { clientX: startX, clientY: startY, bubbles: true }));
            window.dispatchEvent(new MouseEvent('mousemove', { clientX: startX + 45, clientY: startY + 35, bubbles: true }));
            window.dispatchEvent(new MouseEvent('mouseup', { clientX: startX + 45, clientY: startY + 35, bubbles: true }));

            const cropperImg = document.getElementById('cropper-image');
            return {
                offsetX: cropperState.offsetX,
                offsetY: cropperState.offsetY,
                transform: cropperImg ? cropperImg.style.transform : ''
            };
        })()""", 'returnByValue': True})
        drag_info = res["result"]["result"]["value"]
        print("After Mouse Drag:", drag_info)
        assert drag_info["offsetX"] != 0 and drag_info["offsetY"] != 0, "Offsets should shift on mouse drag!"
        assert "translate" in drag_info["transform"] and "scale" in drag_info["transform"], f"Transform must contain translate and scale! Got: {drag_info['transform']}"

        # 5. TEST CANCEL BUTTON & INPUT RESET
        print("\n--- TEST 5: Botón Cancelar y Reset de input[type=file] ---")
        call('Runtime.evaluate', {'expression': """(() => {
            document.getElementById('cropper-cancel-btn').click();
        })()"""})
        time.sleep(0.5)

        res = call('Runtime.evaluate', {'expression': """(() => {
            const modal = document.getElementById('avatar-cropper-modal');
            const input = document.getElementById('photo-file-input');
            return {
                modalClosed: modal.classList.contains('hidden'),
                bodyOverflow: document.body.style.overflow,
                inputFileValue: input.value
            };
        })()""", 'returnByValue': True})
        cancel_info = res["result"]["result"]["value"]
        print("After Cancel button:", cancel_info)
        assert cancel_info["modalClosed"], "Modal must be closed!"
        assert cancel_info["bodyOverflow"] == "", "Body overflow must be restored to empty!"
        assert cancel_info["inputFileValue"] == "", "Input file value must be reset to empty!"

        # 6. RE-OPEN AND TEST "✓ Guardar foto"
        print("\n--- TEST 6: Guardar Foto (Canvas 400x400, Supabase Storage, Navbar Update) ---")
        # Trigger file selection again
        call('Runtime.evaluate', {'expression': """(async () => {
            const c = document.createElement('canvas');
            c.width = 600;
            c.height = 600;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#064e3b';
            ctx.fillRect(0, 0, 600, 600);
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(300, 300, 160, 0, Math.PI * 2);
            ctx.fill();

            const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9));
            const file = new File([blob], 'final_avatar.jpg', { type: 'image/jpeg' });
            openAvatarCropperModal(file);
        })()""", 'awaitPromise': True})
        time.sleep(1)

        # Shift offset and zoom slightly
        call('Runtime.evaluate', {'expression': """(() => {
            adjustCropperZoom(0.3); // zoom = 1.3
            cropperState.offsetX = 20;
            cropperState.offsetY = 15;
            updateCropperTransform();
        })()"""})
        time.sleep(0.3)

        # Click save button
        res = call('Runtime.evaluate', {'expression': """(async () => {
            await saveCroppedAvatar();
            return {
                modalClosed: document.getElementById('avatar-cropper-modal').classList.contains('hidden'),
                bodyOverflow: document.body.style.overflow,
                cachedProfile: JSON.parse(localStorage.getItem('rb_cached_profile') || '{}'),
                navImgHidden: document.getElementById('nav-user-avatar')?.classList.contains('hidden'),
                navImgSrc: document.getElementById('nav-user-avatar')?.src,
                navImgClass: document.getElementById('nav-user-avatar')?.className,
                navInitialsHidden: document.getElementById('nav-user-initials')?.classList.contains('hidden'),
                profilePreviewSrc: document.getElementById('profile-avatar-preview')?.src
            };
        })()""", 'awaitPromise': True, 'returnByValue': True})
        save_info = res["result"]["result"]["value"]
        print("After Save Photo:", save_info)
        assert save_info["modalClosed"], "Modal must be closed after saving!"
        assert save_info["bodyOverflow"] == "", "Body overflow must be restored to empty!"
        assert save_info["cachedProfile"].get("avatar_url"), "Cached profile must have avatar_url!"
        assert not save_info["navImgHidden"], "Navbar avatar image must NOT be hidden after save!"
        assert "w-full h-full object-cover object-center block" in save_info["navImgClass"], "Navbar image must have object-cover object-center block!"
        assert save_info["navInitialsHidden"], "Navbar initials must be hidden after avatar save!"
        assert save_info["navImgSrc"] == save_info["profilePreviewSrc"], "Navbar and profile preview must match!"

        # 7. TEST RECARGA DE PÁGINA (perfil.html) - PERSISTENCIA DE AVATAR SIN REGRESAR A "M"
        print("\n--- TEST 7: Recarga de perfil.html (Verificar que NO regrese al círculo verde con 'M') ---")
        if script_id:
            call('Page.removeScriptToEvaluateOnNewDocument', {'identifier': script_id})
        call('Page.reload')
        time.sleep(2.5) # Esperar hidratación síncrona y sincronización en segundo plano con Supabase

        res = call('Runtime.evaluate', {'expression': """(() => {
            const navImg = document.getElementById('nav-user-avatar');
            const navInitials = document.getElementById('nav-user-initials');
            const preview = document.getElementById('profile-avatar-preview');
            const cached = JSON.parse(localStorage.getItem('rb_cached_profile') || '{}');
            return {
                navImgHidden: navImg ? navImg.classList.contains('hidden') : true,
                navImgSrc: navImg ? navImg.src : '',
                navInitialsHidden: navInitials ? navInitials.classList.contains('hidden') : false,
                navInitialsText: navInitials ? navInitials.textContent.trim() : '',
                previewSrc: preview ? preview.src : '',
                cachedAvatar: cached.avatar_url || ''
            };
        })()""", 'returnByValue': True})
        reload_info = res["result"]["result"]["value"]
        print("After Page Reload:", reload_info)
        assert not reload_info["navImgHidden"], "El avatar en el Navbar debe seguir VISIBLE tras recargar!"
        assert reload_info["navImgSrc"] and "avatar_" in reload_info["navImgSrc"], f"El avatar debe tener la URL de la foto tras recargar, got: {reload_info['navImgSrc']}"
        assert reload_info["navInitialsHidden"], "Las iniciales ('M') deben seguir OCULTAS tras recargar!"
        assert reload_info["previewSrc"] and "avatar_" in reload_info["previewSrc"], "La previsualización de perfil debe mantener la foto!"

        # 8. TEST NAVEGACIÓN A mercado.html - NAVBAR SINCRONIZADO CON FOTO
        print("\n--- TEST 8: Navegación a mercado.html (Navbar sincronizado con foto) ---")
        call('Page.navigate', {'url': 'http://localhost:5500/mercado.html'})
        time.sleep(2.0)

        res = call('Runtime.evaluate', {'expression': """(() => {
            const navImg = document.getElementById('nav-user-avatar') || document.querySelector('#user-avatar-btn img');
            const navInitials = document.getElementById('nav-user-initials');
            return {
                hasUserBtn: !!document.getElementById('user-avatar-btn'),
                navImgHidden: navImg ? navImg.classList.contains('hidden') : true,
                navImgSrc: navImg ? navImg.src : '',
                navInitialsHidden: navInitials ? navInitials.classList.contains('hidden') : false
            };
        })()""", 'returnByValue': True})
        mercado_info = res["result"]["result"]["value"]
        print("En mercado.html:", mercado_info)
        assert mercado_info["hasUserBtn"], "Debe mostrar el botón de usuario logueado en mercado.html"
        assert not mercado_info["navImgHidden"], "El avatar debe estar visible en mercado.html!"
        assert mercado_info["navImgSrc"] and "avatar_" in mercado_info["navImgSrc"], "El avatar en mercado.html debe mostrar la foto subida!"
        assert mercado_info["navInitialsHidden"], "Las iniciales deben estar ocultas en mercado.html!"

        # 9. TEST NAVEGACIÓN A index.html - NAVBAR SINCRONIZADO CON FOTO
        print("\n--- TEST 9: Navegación a index.html (Navbar sincronizado con foto) ---")
        call('Page.navigate', {'url': 'http://localhost:5500/index.html'})
        time.sleep(2.0)

        res = call('Runtime.evaluate', {'expression': """(() => {
            const navImg = document.getElementById('nav-user-avatar') || document.querySelector('#user-avatar-btn img');
            const navInitials = document.getElementById('nav-user-initials');
            return {
                hasUserBtn: !!document.getElementById('user-avatar-btn'),
                navImgHidden: navImg ? navImg.classList.contains('hidden') : true,
                navImgSrc: navImg ? navImg.src : '',
                navInitialsHidden: navInitials ? navInitials.classList.contains('hidden') : false
            };
        })()""", 'returnByValue': True})
        index_info = res["result"]["result"]["value"]
        print("En index.html:", index_info)
        assert index_info["hasUserBtn"], "Debe mostrar el botón de usuario logueado en index.html"
        assert not index_info["navImgHidden"], "El avatar debe estar visible en index.html!"
        assert index_info["navImgSrc"] and "avatar_" in index_info["navImgSrc"], "El avatar en index.html debe mostrar la foto subida!"
        assert index_info["navInitialsHidden"], "Las iniciales deben estar ocultas en index.html!"

        print("\n==========================================")
        print(">>> ALL TESTS PASSED SUCCESSFULLY 100%! <<<")
        print("==========================================")
    finally:
        proc.terminate()

if __name__ == '__main__':
    test_cropper()
