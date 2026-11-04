import pathlib, sys
src = pathlib.Path(__file__).resolve().parent.parent / 'src'
out = pathlib.Path(sys.argv[1])
h = (src / 'index.html').read_text()
for tag, f in (('/*CSS*/', 'style.css'), ('/*GEO*/', 'geo.js'), ('/*DATA*/', 'data.js'), ('/*APP*/', 'app.js')):
    h = h.replace(tag, (src / f).read_text())
out.write_text(h)
print(out, len(h))
