"""Mantiene la entrada pública igual que la última versión de Tinta."""
from pathlib import Path
import argparse
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
source=root/'web/crear.html';target=root/'web/index.html'
if args.check:
    if source.read_bytes()!=target.read_bytes():raise SystemExit('ERROR: index.html no coincide con Tinta. Ejecuta python tools/sync-tinta-entry.py')
    print('Entrada verificada: index.html = Tinta actual')
else:
    target.write_bytes(source.read_bytes());print('Portada actualizada con Tinta')
