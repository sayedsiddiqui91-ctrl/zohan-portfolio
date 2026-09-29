# Static server for site/ plus POST /__save?name=x.png to store review renders.
import http.server, os, sys, base64, urllib.parse

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.renders')
os.makedirs(OUT, exist_ok=True)

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        if u.path != '/__save':
            self.send_error(404); return
        name = os.path.basename(urllib.parse.parse_qs(u.query).get('name', ['shot.png'])[0])
        n = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(n).decode()
        if ',' in data:
            data = data.split(',', 1)[1]
        with open(os.path.join(OUT, name), 'wb') as f:
            f.write(base64.b64decode(data))
        self.send_response(200); self.end_headers(); self.wfile.write(b'ok')

    def log_message(self, *a):
        pass

http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 5173), H).serve_forever()
