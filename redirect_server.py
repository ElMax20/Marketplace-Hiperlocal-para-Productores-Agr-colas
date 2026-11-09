import http.server, urllib.request, urllib.parse, json

ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anFndnBsYm1zaHB1Y251emZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5OTcyMDgsImV4cCI6MjEwOTU3MzIwOH0.cEWJYxNjq04f8auZzK9PoGlQUa_EnRtORxT6z85LmLU'
GITHUB_BASE = 'https://elmax20.github.io/Marketplace-Hiperlocal-para-Productores-Agr-colas/perfil.html'

def get_latest_valid_token():
    try:
        url = 'https://hvjqgvplbmshpucnuzfy.supabase.co/rest/v1/email_change_requests?expires_at=gt.now()&order=created_at.desc&limit=1&select=verification_token'
        headers = {
            'apikey': ANON_KEY,
            'Authorization': f'Bearer {ANON_KEY}'
        }
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            if data and len(data) > 0:
                return data[0].get('verification_token')
    except Exception as e:
        print("Error fetching latest token:", e)
    return None

class LocalhostRedirectHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlsplit(self.path)
        path = parsed.path
        query = parsed.query

        if 'verify-email' in path or 'verify' in path:
            # Check if query has token
            q_dict = urllib.parse.parse_qs(query)
            token = q_dict.get('token', [None])[0] or q_dict.get('verify_email_token', [None])[0]

            if not token:
                # Fallback: get the latest pending token from Supabase
                token = get_latest_valid_token()

            target_url = f"{GITHUB_BASE}?token={token}" if token else GITHUB_BASE
            print(f"[Redirect 3000] Redirigiendo {self.path} -> {target_url}")
            
            self.send_response(302)
            self.send_header('Location', target_url)
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.end_headers()
            return

        super().do_GET()

if __name__ == '__main__':
    server = http.server.ThreadingHTTPServer(('0.0.0.0', 3000), LocalhostRedirectHandler)
    print("Servidor de rescate y redireccion a GitHub Pages activo en http://localhost:3000")
    server.serve_forever()

