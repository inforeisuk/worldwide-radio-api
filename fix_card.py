with open("src/public/app.js", "r") as f:
    js = f.read()

js = js.replace(
    "${station.description || 'Transmissão ao vivo via internet.'}",
    "${station.description || (t.liveStream || 'Transmissão ao vivo via internet.')}"
)
js = js.replace(
    "Ouvir\n        </button>",
    "${t.btnPlay || 'Ouvir'}\n        </button>"
)
js = js.replace(
    "title=\"Partilhar Rádio\"",
    "title=\"${t.share || 'Partilhar Rádio'}\""
)

with open("src/public/app.js", "w") as f:
    f.write(js)
print("done")
