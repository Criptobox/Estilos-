"""Empaqueta únicamente código versionado y una copia visual actual verificable."""
from pathlib import Path
import subprocess,sys,tempfile,zipfile,argparse,hashlib,json
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('output');args=p.parse_args();output=Path(args.output).resolve()
subprocess.run([sys.executable,str(root/'tools/sync-tinta-entry.py'),'--check'],check=True)
if subprocess.check_output(['git','status','--porcelain'],cwd=root).strip():raise SystemExit('Haz commit antes de empaquetar para identificar exactamente esta entrega.')
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
files=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0');files=[f for f in files if f]
output.parent.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    standalone=Path(tmp)/'ABRIR-TINTA-ACTUAL.html'
    subprocess.run([sys.executable,str(root/'tools/build-tinta.py'),'--output',str(standalone)],check=True)
    with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
        for f in files:z.write(root/f,f)
        z.write(standalone,standalone.name)
        hashes={f:hashlib.sha256((root/f).read_bytes()).hexdigest() for f in ['web/index.html','web/crear.html','web/sw.js','web/js/crear.js','web/js/tinta-history.js']}
        z.writestr('VERSION-ENTREGA.json',json.dumps({'commit':commit,'entrada':'web/index.html','interfaz':'Tinta actual con estilos e historial','archivos_sha256':hashes},ensure_ascii=False,indent=2))
with zipfile.ZipFile(output) as z:
    assert z.testzip() is None
    assert z.read('web/index.html')==z.read('web/crear.html')
    assert b'tinta-history.js' in z.read('web/index.html')
    assert b'cardStyleDialog' in z.read('web/index.html')
    assert not any(n.startswith('.git/') or '/node_modules/' in n for n in z.namelist())
    print(f'ZIP verificado: {output} · {len(z.namelist())} archivos · commit {commit[:7]}')
