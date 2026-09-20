import re

# 1. Update index.html
with open("src/public/index.html", "r") as f:
    html = f.read()

html = html.replace('✓ Ativo</span>', '✓ <span data-i18n="active">Ativo</span></span>')
html = html.replace('📍 Perto de Mim', '📍 <span data-i18n="nearMe">Perto de Mim</span>')
html = html.replace('<button class="chip active" data-genre="">Todos</button>', '<button class="chip active" data-genre="" data-i18n="genreAll">Todos</button>')
html = html.replace('<button class="chip" data-genre="News">Notícias</button>', '<button class="chip" data-genre="News" data-i18n="genreNews">Notícias</button>')
html = html.replace('<button class="chip" data-genre="Classical">Clássica</button>', '<button class="chip" data-genre="Classical" data-i18n="genreClassical">Clássica</button>')
html = html.replace('<button class="chip" data-genre="Electronic">Eletrónica</button>', '<button class="chip" data-genre="Electronic" data-i18n="genreElectronic">Eletrónica</button>')

with open("src/public/index.html", "w") as f:
    f.write(html)

# 2. Update app.js updateResultsInfo
with open("src/public/app.js", "r") as f:
    js = f.read()

# Add keys to translations
def add_keys(lang_content, is_pt):
    if is_pt:
        return lang_content + ",\n    active: 'Ativo',\n    nearMe: 'Perto de Mim',\n    genreAll: 'Todos',\n    genreNews: 'Notícias',\n    genreClassical: 'Clássica',\n    genreElectronic: 'Eletrónica',\n    foundSuffix: ' encontrada',\n    foundSuffixPlural: ' encontradas',\n    resultsFor: 'Resultados para',\n    resultsIn: 'em',\n    noFilters: 'Sem filtros'"
    elif "EN" in lang_content or "All Stations" in lang_content: # EN
        return lang_content + ",\n    active: 'Active',\n    nearMe: 'Near Me',\n    genreAll: 'All',\n    genreNews: 'News',\n    genreClassical: 'Classical',\n    genreElectronic: 'Electronic',\n    foundSuffix: ' found',\n    foundSuffixPlural: ' found',\n    resultsFor: 'Results for',\n    resultsIn: 'in',\n    noFilters: 'No filters'"
    elif "ES" in lang_content or "Todas las Estaciones" in lang_content: # ES
        return lang_content + ",\n    active: 'Activo',\n    nearMe: 'Cerca de Mí',\n    genreAll: 'Todos',\n    genreNews: 'Noticias',\n    genreClassical: 'Clásica',\n    genreElectronic: 'Electrónica',\n    foundSuffix: ' encontrada',\n    foundSuffixPlural: ' encontradas',\n    resultsFor: 'Resultados para',\n    resultsIn: 'en',\n    noFilters: 'Sin filtros'"
    elif "FR" in lang_content or "Toutes les Stations" in lang_content: # FR
        return lang_content + ",\n    active: 'Actif',\n    nearMe: 'Près de Moi',\n    genreAll: 'Tous',\n    genreNews: 'Actualités',\n    genreClassical: 'Classique',\n    genreElectronic: 'Électronique',\n    foundSuffix: ' trouvée',\n    foundSuffixPlural: ' trouvées',\n    resultsFor: 'Résultats pour',\n    resultsIn: 'dans',\n    noFilters: 'Sans filtres'"
    elif "DE" in lang_content or "Alle Sender" in lang_content: # DE
        return lang_content + ",\n    active: 'Aktiv',\n    nearMe: 'In meiner Nähe',\n    genreAll: 'Alle',\n    genreNews: 'Nachrichten',\n    genreClassical: 'Klassik',\n    genreElectronic: 'Elektronisch',\n    foundSuffix: ' gefunden',\n    foundSuffixPlural: ' gefunden',\n    resultsFor: 'Ergebnisse für',\n    resultsIn: 'in',\n    noFilters: 'Ohne Filter'"
    return lang_content

js = re.sub(r"(mobileMenu: 'Menu'[^}]*?)(\n  })", lambda m: add_keys(m.group(1), True) + m.group(2), js, count=1)
js = re.sub(r"(mobileMenu: 'Menu'[^}]*?)(\n  })", lambda m: add_keys(m.group(1), False) + m.group(2), js, count=1) # EN has same mobileMenu, will match second occurrence
js = re.sub(r"(mobileMenu: 'Menú'[^}]*?)(\n  })", lambda m: add_keys(m.group(1), False) + m.group(2), js, count=1)
js = re.sub(r"(mobileMenu: 'Menu'[^}]*?)(\n  })", lambda m: add_keys(m.group(1), False) + m.group(2), js, count=1) # FR has 'Menu', third occurrence
js = re.sub(r"(mobileMenu: 'Menü'[^}]*?)(\n  })", lambda m: add_keys(m.group(1), False) + m.group(2), js, count=1)

# Now fix updateResultsInfo
new_update_results = """function updateResultsInfo() {
  const t = translations[state.currentLang] || translations.pt;
  const found = state.totalStations === 1 ? (t.foundSuffix || ' encontrada') : (t.foundSuffixPlural || ' encontradas');
  const countText = `${state.totalStations.toLocaleString()}${found}`;
  elements.resultsCount.textContent = countText;

  if (state.activeTab === 'favorites') {
    elements.resultsTitle.textContent = (t.myFavorites || 'Minhas Estações Favoritas') + ' ⭐';
  } else if (state.activeTab === 'recents') {
    elements.resultsTitle.textContent = (t.recentlyPlayed || 'Ouvidas Recentemente') + ' 🕒';
  } else if (state.searchQuery) {
    elements.resultsTitle.textContent = `${t.resultsFor || 'Resultados para'} "${state.searchQuery}"`;
  } else if (state.selectedCountry) {
    const cName = elements.countrySelect.options[elements.countrySelect.selectedIndex]?.text || state.selectedCountry;
    elements.resultsTitle.textContent = `${t.resultsFor || 'Resultados'} ${t.resultsIn || 'em'} ${cName}`;
  } else if (state.selectedGenre) {
    elements.resultsTitle.textContent = `${t.resultsFor || 'Resultados'} ${t.resultsIn || 'em'} ${state.selectedGenre}`;
  } else {
    elements.resultsTitle.textContent = t.allStations || 'Todas as Estações';
  }
}"""

js = re.sub(r"function updateResultsInfo\(\) \{.*?(?=\n\}\n)\n\}", new_update_results, js, flags=re.DOTALL)

with open("src/public/app.js", "w") as f:
    f.write(js)
