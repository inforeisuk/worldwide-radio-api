with open("src/public/app.js", "r") as f:
    js = f.read()

js = js.replace(
    "elements.btnPrevPage.addEventListener('click', () => {\n  if (state.page > 1) {\n    state.page--;\n    fetchStations();\n    window.scrollTo({ top: 350, behavior: 'smooth' });\n  }",
    "elements.btnPrevPage.addEventListener('click', async () => {\n  if (state.page > 1) {\n    state.page--;\n    elements.btnPrevPage.disabled = true;\n    await fetchStations();\n    window.scrollTo({ top: 350, behavior: 'smooth' });\n  }"
)

js = js.replace(
    "elements.btnNextPage.addEventListener('click', () => {\n  if (state.page < state.totalPages) {\n    state.page++;\n    fetchStations();\n    window.scrollTo({ top: 350, behavior: 'smooth' });\n  }",
    "elements.btnNextPage.addEventListener('click', async () => {\n  if (state.page < state.totalPages) {\n    state.page++;\n    elements.btnNextPage.disabled = true;\n    await fetchStations();\n    window.scrollTo({ top: 350, behavior: 'smooth' });\n  }"
)

with open("src/public/app.js", "w") as f:
    f.write(js)
