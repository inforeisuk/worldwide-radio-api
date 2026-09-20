with open("src/public/app.js", "r") as f:
    js = f.read()

js = js.replace(
    "mobileMenu: 'Menu'",
    "mobileMenu: 'Menu',\n    liveStream: 'Transmissão ao vivo via internet.'"
).replace(
    "mobileMenu: 'Menu'",
    "mobileMenu: 'Menu',\n    liveStream: 'Live internet broadcast.'"
).replace( # wait replace works on all occurrences. I'll just use a regex.
    "mobileMenu: 'Menú'",
    "mobileMenu: 'Menú',\n    liveStream: 'Transmisión en vivo por internet.'"
).replace(
    "mobileMenu: 'Menu'",
    "mobileMenu: 'Menu',\n    liveStream: 'Diffusion en direct sur internet.'"
).replace(
    "mobileMenu: 'Menü'",
    "mobileMenu: 'Menü',\n    liveStream: 'Live-Internetübertragung.'"
)

# A better way is to just do a simple replacement for each language.
