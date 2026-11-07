from pathlib import Path
p=Path(__file__).parent
html=(p/"index-source.html").read_text(encoding="utf8")
css=(p/"style.css").read_text(encoding="utf8")
js=(p/"game.js").read_text(encoding="utf8")
assert '<link rel="stylesheet" href="style.css">' in html
assert '<script src="game.js" defer></script>' in html
out=html.replace('<link rel="stylesheet" href="style.css">',"<style>"+css+"</style>").replace('<script src="game.js" defer></script>',"<script>"+js+"</script>")
(p/"index.html").write_text(out,encoding="utf8")
print("Built index.html",len(out.encode("utf8")),"bytes")
