with open("src/public/app.js", "r") as f:
    lines = f.readlines()

new_lines = []
in_en = False
in_es = False
in_fr = False
in_de = False

for line in lines:
    if "en: {" in line:
        in_en = True
    elif "es: {" in line:
        in_es = True
    elif "fr: {" in line:
        in_fr = True
    elif "de: {" in line:
        in_de = True
    
    # We look for the last property before the block closes. Usually `mobileMenu: ...`
    if "mobileMenu:" in line:
        new_lines.append(line.rstrip() + ",\n")
        if in_en:
            new_lines.append("    active: 'Active',\n    nearMe: 'Near Me',\n    genreAll: 'All',\n    genreNews: 'News',\n    genreClassical: 'Classical',\n    genreElectronic: 'Electronic',\n    foundSuffix: ' found',\n    foundSuffixPlural: ' found',\n    resultsFor: 'Results for',\n    resultsIn: 'in',\n    noFilters: 'No filters'\n")
            in_en = False
        elif in_es:
            new_lines.append("    active: 'Activo',\n    nearMe: 'Cerca de Mí',\n    genreAll: 'Todos',\n    genreNews: 'Noticias',\n    genreClassical: 'Clásica',\n    genreElectronic: 'Electrónica',\n    foundSuffix: ' encontrada',\n    foundSuffixPlural: ' encontradas',\n    resultsFor: 'Resultados para',\n    resultsIn: 'en',\n    noFilters: 'Sin filtros'\n")
            in_es = False
        elif in_fr:
            new_lines.append("    active: 'Actif',\n    nearMe: 'Près de Moi',\n    genreAll: 'Tous',\n    genreNews: 'Actualités',\n    genreClassical: 'Classique',\n    genreElectronic: 'Électronique',\n    foundSuffix: ' trouvée',\n    foundSuffixPlural: ' trouvées',\n    resultsFor: 'Résultats pour',\n    resultsIn: 'dans',\n    noFilters: 'Sans filtres'\n")
            in_fr = False
        elif in_de:
            new_lines.append("    active: 'Aktiv',\n    nearMe: 'In meiner Nähe',\n    genreAll: 'Alle',\n    genreNews: 'Nachrichten',\n    genreClassical: 'Klassik',\n    genreElectronic: 'Elektronisch',\n    foundSuffix: ' gefunden',\n    foundSuffixPlural: ' gefunden',\n    resultsFor: 'Ergebnisse für',\n    resultsIn: 'in',\n    noFilters: 'Ohne Filter'\n")
            in_de = False
        else: # Already added pt from the previous python script, but let's check
            # Wait, if I do this, I will add a comma and newline to PT's last property, which is fine, but PT already has these new keys.
            # Wait! The previous script ADDED the keys to PT! So mobileMenu is NO LONGER the last property of PT!
            # The last property of PT is `noFilters: 'Sem filtros'`.
            # For EN, ES, FR, DE, `mobileMenu:` IS still the last property.
            pass
    else:
        new_lines.append(line)

with open("src/public/app.js", "w") as f:
    f.writelines(new_lines)
