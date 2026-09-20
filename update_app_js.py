import re

with open("src/public/app.js", "r") as f:
    js_content = f.read()

# Replace PT
js_content = js_content.replace(
    "mobileMenu: 'Menu'\n  },",
    "mobileMenu: 'Menu',\n    emptyFavs: 'Ainda não adicionou nenhuma rádio às favoritas. Clique na estrela ★ de qualquer rádio!',\n    emptyRecents: 'Nenhuma rádio ouvida recentemente.',\n    emptySearch: 'Nenhuma estação encontrada 📻. Tente ajustar os filtros.',\n    emptyList: 'Lista Vazia',\n    btnPlay: 'Ouvir',\n    noInfo: 'Sem info',\n    listen: 'Ouvir'\n  },"
)

# Replace EN
js_content = js_content.replace(
    "mobileMenu: 'Menu'\n  },",
    "mobileMenu: 'Menu',\n    emptyFavs: 'You haven\\'t added any radio to favorites yet. Click the star ★ on any radio!',\n    emptyRecents: 'No recently played radios.',\n    emptySearch: 'No stations found 📻. Try adjusting your filters.',\n    emptyList: 'Empty List',\n    btnPlay: 'Listen',\n    noInfo: 'No info',\n    listen: 'Listen'\n  },"
)

# Replace ES
js_content = js_content.replace(
    "mobileMenu: 'Menú'\n  },",
    "mobileMenu: 'Menú',\n    emptyFavs: 'Aún no has añadido ninguna radio a favoritas. ¡Haz clic en la estrella ★ de cualquier radio!',\n    emptyRecents: 'No hay radios escuchadas recientemente.',\n    emptySearch: 'No se encontraron estaciones 📻. Intenta ajustar los filtros.',\n    emptyList: 'Lista Vacía',\n    btnPlay: 'Escuchar',\n    noInfo: 'Sin info',\n    listen: 'Escuchar'\n  },"
)

# Replace FR
# wait, EN also uses mobileMenu: 'Menu'. So the first replace will do EN too if I don't specify the lang block.
