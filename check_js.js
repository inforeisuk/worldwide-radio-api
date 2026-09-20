const fs = require('fs');
try {
  require('./src/public/app.js');
  console.log("No syntax errors found.");
} catch (e) {
  console.log("Syntax error:", e);
}
