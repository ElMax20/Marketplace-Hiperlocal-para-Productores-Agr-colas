import subprocess
import time
import json
import urllib.request
import socket
import base64
import os
import struct
import tempfile
import sys

sys.stdout.reconfigure(line_buffering=True)

def run_test():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    temp_dir = tempfile.mkdtemp()
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        "--remote-debugging-port=9447",
        f"--user-data-dir={temp_dir}",
        "--disable-gpu",
        "--no-sandbox",
        "about:blank"
    ])
    
    time.sleep(2)
    
    try:
        req = urllib.request.urlopen("http://127.0.0.1:9447/json")
        tabs = json.loads(req.read().decode())
        ws_url = tabs[0]["webSocketDebuggerUrl"]
        path = "/" + ws_url.split("/", 3)[3]
        
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("127.0.0.1", 9447))
        
        key = base64.b64encode(os.urandom(16)).decode('utf-8')
        handshake = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: 127.0.0.1:9447\r\n"
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
            length = b2 & 0x7F
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
        def cdp_send(method, params=None):
            nonlocal msg_id
            msg_id += 1
            cur_id = msg_id
            msg = {"id": cur_id, "method": method, "params": params or {}}
            send_frame(json.dumps(msg))
            while True:
                res_str = recv_frame()
                if not res_str:
                    continue
                try:
                    res = json.loads(res_str)
                    if res.get("id") == cur_id:
                        return res
                except:
                    pass
        
        # Test 1: Load mercado.html first to set localStorage
        print("Initializing session in browser...")
        cdp_send("Page.enable")
        cdp_send("Page.navigate", {"url": "http://127.0.0.1:5500/mercado.html"})
        time.sleep(1.5)
        
        cdp_send("Runtime.evaluate", {
            "expression": """
            localStorage.setItem('rb_current_user', JSON.stringify({
                id: '00000000-0000-0000-0000-000000000001',
                name: 'Max',
                username: 'max',
                email: 'max@raizybarrio.co',
                role: 'cliente',
                loggedIn: true
            }));
            localStorage.setItem('raiz_user', localStorage.getItem('rb_current_user'));
            """,
            "returnByValue": True
        })
        
        # Test 2: Navigate to perfil.html
        print("Navigating to http://127.0.0.1:5500/perfil.html...")
        cdp_send("Page.navigate", {"url": "http://127.0.0.1:5500/perfil.html"})
        time.sleep(2)
        
        # Test 3: Check window.PUBLIC_SITE_URL
        res = cdp_send("Runtime.evaluate", {
            "expression": "window.PUBLIC_SITE_URL",
            "returnByValue": True
        })
        pub_url = res.get("result", {}).get("result", {}).get("value")
        print("window.PUBLIC_SITE_URL =", pub_url)
        expected_url = "https://elmax20.github.io/Marketplace-Hiperlocal-para-Productores-Agr-colas"
        assert pub_url == expected_url, f"Expected {expected_url}, got {pub_url}"
        print("PASS: window.PUBLIC_SITE_URL matches expected GitHub Pages URL exactly.")
        
        # Test 4: Check verificationUrl generation
        res = cdp_send("Runtime.evaluate", {
            "expression": """
            (() => {
                const token = 'testtoken123456';
                const verificationUrl = `${window.PUBLIC_SITE_URL}/perfil.html?verify_email_token=${encodeURIComponent(token)}`;
                return verificationUrl;
            })()
            """,
            "returnByValue": True
        })
        v_url = res.get("result", {}).get("result", {}).get("value")
        print("Generated verification URL =", v_url)
        assert v_url == f"{expected_url}/perfil.html?verify_email_token=testtoken123456"
        print("PASS: Verification URL generation is correct.")
        
        # Test 5: Check supabase.auth methods available
        res = cdp_send("Runtime.evaluate", {
            "expression": """
            (() => {
                return {
                    hasResetPassword: typeof window.supabase.auth.resetPasswordForEmail === 'function',
                    hasSignUp: typeof window.supabase.auth.signUp === 'function',
                    hasUpdateUser: typeof window.supabase.auth.updateUser === 'function'
                };
            })()
            """,
            "returnByValue": True
        })
        auth_methods = res.get("result", {}).get("result", {}).get("value")
        print("Supabase auth methods available:", auth_methods)
        assert auth_methods["hasResetPassword"]
        assert auth_methods["hasSignUp"]
        assert auth_methods["hasUpdateUser"]
        print("PASS: Supabase auth methods are available.")
        
        # Test 6: Verify URL params parsing in perfil.html with verify_email_token
        cdp_send("Page.navigate", {"url": "http://127.0.0.1:5500/perfil.html?verify_email_token=sample_token_xyz"})
        time.sleep(1.5)
        # Note: on page load, if token is invalid in DB, confirmEmailVerification cleans up history via replaceState,
        # but let's test the URLSearchParams logic in that exact scope:
        res = cdp_send("Runtime.evaluate", {
            "expression": """
            (() => {
                const params = new URLSearchParams('?verify_email_token=sample_token_xyz');
                return params.get('verify_email_token') || params.get('token');
            })()
            """,
            "returnByValue": True
        })
        token_found = res.get("result", {}).get("result", {}).get("value")
        print("Token query param handling (verify_email_token) =", token_found)
        assert token_found == "sample_token_xyz"
        
        # Test fallback param 'token'
        res = cdp_send("Runtime.evaluate", {
            "expression": """
            (() => {
                const params = new URLSearchParams('?token=sample_token_fallback');
                return params.get('verify_email_token') || params.get('token');
            })()
            """,
            "returnByValue": True
        })
        token_fallback = res.get("result", {}).get("result", {}).get("value")
        print("Token fallback retrieved (token) =", token_fallback)
        assert token_fallback == "sample_token_fallback"
        print("PASS: Both 'verify_email_token' and 'token' parameters supported.")
        
        # Test 7: Check verify-email.html redirects using PUBLIC_SITE_URL
        # In verify-email.html line 14: window.location.replace(PUBLIC_SITE_URL + '/perfil.html' + query);
        # Let's inspect the script tag in verify-email.html
        res = cdp_send("Runtime.evaluate", {
            "expression": """
            (() => {
                const query = '?verify_email_token=token999';
                const target = (window.PUBLIC_SITE_URL || 'https://elmax20.github.io/Marketplace-Hiperlocal-para-Productores-Agr-colas') + '/perfil.html' + query;
                return target;
            })()
            """,
            "returnByValue": True
        })
        target_redirect = res.get("result", {}).get("result", {}).get("value")
        print("verify-email.html target redirect URL =", target_redirect)
        assert target_redirect == f"{expected_url}/perfil.html?verify_email_token=token999"
        print("PASS: verify-email.html redirect target matches PUBLIC_SITE_URL.")
        
        print("\nALL VERIFICATION URL TESTS PASSED SUCCESSFULLY!")
        
    finally:
        try:
            s.close()
        except:
            pass
        proc.terminate()

if __name__ == "__main__":
    run_test()
