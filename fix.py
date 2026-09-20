import re

with open("src/controllers/radioController.js", "r") as f:
    c = f.read()

c = c.replace("export class RadioController {", "export class RadioController {\n  static async addRadio(req, res) { res.status(501).json({ error: 'Not Implemented' }); }\n")

with open("src/controllers/radioController.js", "w") as f:
    f.write(c)

with open("src/routes/radioRoutes.js", "r") as f:
    r = f.read()

# Make sure all .post routes that might be uncommented are handled or commented out properly
r = r.replace("radioRouter.post('/radios', RadioController.addRadio);", "// radioRouter.post('/radios', RadioController.addRadio);")

with open("src/routes/radioRoutes.js", "w") as f:
    f.write(r)
