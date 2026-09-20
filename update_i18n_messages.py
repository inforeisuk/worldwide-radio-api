import re

with open("src/public/app.js", "r") as f:
    js_content = f.read()

# 1. Add new keys to all languages in translations
replacements = {
    "mobileMenu: 'Menu'": "mobileMenu: 'Menu',\n    emptyFavs: 'Ainda não adicionou nenhuma rádio às favoritas. Clique na estrela ★ de qualquer rádio!',\n    emptyRecents: 'Nenhuma rádio ouvida recentemente.',\n    emptySearch: 'Nenhuma estação encontrada 📻. Tente ajustar os filtros.',\n    emptyList: 'Lista Vazia'",
    "mobileMenu: 'Menu'": "mobileMenu: 'Menu',\n    emptyFavs: 'You haven\\'t added any radio to favorites yet. Click the star ★ on any radio!',\n    emptyRecents: 'No recently played radios.',\n    emptySearch: 'No stations found 📻. Try adjusting your filters.',\n    emptyList: 'Empty List'",
    "mobileMenu: 'Menú'": "mobileMenu: 'Menú',\n    emptyFavs: 'Aún no has añadido ninguna radio a favoritas. ¡Haz clic en la estrella ★ de cualquier radio!',\n    emptyRecents: 'No hay radios escuchadas recientemente.',\n    emptySearch: 'No se encontraron estaciones 📻. Intenta ajustar los filtros.',\n    emptyList: 'Lista Vacía'",
    "mobileMenu: 'Menu'": "mobileMenu: 'Menu',\n    emptyFavs: 'Vous n\\'avez pas encore ajouté de radio aux favoris. Cliquez sur l\\'étoile ★ de n\\'importe quelle radio !',\n    emptyRecents: 'Aucune radio écoutée récemment.',\n    emptySearch: 'Aucune station trouvée 📻. Essayez d\\'ajuster les filtres.',\n    emptyList: 'Liste Vide'",
    "mobileMenu: 'Menü'": "mobileMenu: 'Menü',\n    emptyFavs: 'Sie haben noch kein Radio zu Ihren Favoriten hinzugefügt. Klicken Sie auf den Stern ★ bei einem beliebigen Radio!',\n    emptyRecents: 'Keine zuletzt gehörten Radios.',\n    emptySearch: 'Keine Sender gefunden 📻. Versuchen Sie, die Filter anzupassen.',\n    emptyList: 'Leere Liste'"
}

# The above replacements dictionary won't work well because keys in python dict must be unique.
