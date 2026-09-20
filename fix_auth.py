import re

with open("src/middlewares/authMiddleware.js", "r") as f:
    js = f.read()

replacement = """  // Exceção: Permitir todos os métodos GET (leitura pública para Web Player e clientes)
  if (req.method === 'GET') {
    return next();
  }

  // Exceção de Segurança Mágica: Permitir o Web Player (Frontend) funcionar sem chave!"""

js = re.sub(r"  // Exceção de Segurança Mágica: Permitir o Web Player \(Frontend\) funcionar sem chave!", replacement, js, flags=re.DOTALL)

with open("src/middlewares/authMiddleware.js", "w") as f:
    f.write(js)
