from pathlib import Path
p=Path(__file__).resolve().parent
html=(p/'template.html').read_text(encoding='utf-8')
css=(p/'style.css').read_text(encoding='utf-8')
js=(p/'game.js').read_text(encoding='utf-8')
assert '<link rel="stylesheet" href="style.css">' in html
assert '<script src="game.js" defer></script>' in html
assert '<script type="module" src="weapon-viewer.js"></script>' in html
models=(p/'weapon-models.js').read_text(encoding='utf-8')
viewer=(p/'weapon-viewer.js').read_text(encoding='utf-8')
out=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>').replace('<script src="game.js" defer></script>','<script>'+js+'</script>').replace('<script type="module" src="weapon-viewer.js"></script>','<script type="module">'+models+'\n'+viewer+'</script>')
(p/'index.html').write_text(out,encoding='utf-8');(p/'OVERDRIVE.html').write_text(out,encoding='utf-8')
print('Built standalone HTML',len(out.encode()),'bytes')
