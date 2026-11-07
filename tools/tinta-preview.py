"""Preview independiente: la raíz lleva al prototipo, no al editor clásico."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
os.chdir(Path(__file__).resolve().parents[1] / 'web')
class Preview(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(302)
            self.send_header('Location', '/crear.html')
            self.end_headers()
        else:
            super().do_GET()
ThreadingHTTPServer(('0.0.0.0', 8081), Preview).serve_forever()
