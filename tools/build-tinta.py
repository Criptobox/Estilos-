"""Genera la copia autónoma sin etiquetas HTML literales dentro del script.
Algunos visores procesan esas etiquetas antes de ejecutar JavaScript.
"""
from pathlib import Path
import base64
import argparse
import re

root = Path(__file__).resolve().parents[1]
web = root / 'web'
parser = argparse.ArgumentParser()
parser.add_argument('--output', default='dist/Estilos-Tinta.html')
output = Path(parser.parse_args().output)
def uri(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')

html = (web / 'crear.html').read_text()
css = (web / 'css/crear.css').read_text()
css = css.replace('../fonts/plus-jakarta-sans.woff2', uri(web / 'fonts/plus-jakarta-sans.woff2', 'font/woff2'))
# Todos los scripts locales en un único payload UTF-8, sin HTML literal visible.
script_paths = re.findall(r'<script src="([^"]+)"></script>', html)
js = b'\n;\n'.join((web / path).read_bytes() for path in script_paths)
encoded = base64.b64encode(js).decode('ascii')
bootstrap = "(()=>{const s=document.createElement('script');s.textContent=new TextDecoder().decode(Uint8Array.from(atob('" + encoded + "'),c=>c.charCodeAt(0)));document.body.appendChild(s);})();"
html = html.replace('<link rel="stylesheet" href="css/crear.css">', '<style>' + css + '</style>')
html = html.replace('<link rel="stylesheet" href="css/equipo.css">', '<style>' + (web / 'css/equipo.css').read_text() + '</style>')
html = re.sub(r'<script src="[^"]+"></script>', '', html)
html = html.replace('</body>', '<script>' + bootstrap + '</script></body>')
html = html.replace('images/tinta-avatar.webp', uri(web / 'images/tinta-avatar.webp', 'image/webp'))
html = html.replace('icons/icon-192.png', uri(web / 'icons/icon-192.png', 'image/png'))
html = html.replace('<a href="biblioteca.html">Biblioteca completa</a><a href="agente.html">Editor clásico y proyectos</a>', '<small>Esta copia contiene solo el prototipo Tinta; el editor clásico sigue en el proyecto original.</small>')
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(html)
print(output)
