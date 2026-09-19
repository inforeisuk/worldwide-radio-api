import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, '../');

const filesToPatch = [
  'controllers/stationDetailController.js',
  'controllers/radioTopController.js',
  'controllers/healthController.js',
  'controllers/recognitionController.js',
  'controllers/artistRadarController.js',
  'controllers/metaController.js',
  'controllers/diagnosticsController.js',
  'controllers/logoController.js'
];

for (const file of filesToPatch) {
  const filePath = path.join(SRC_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Not found: ${file}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (!content.includes('DBService')) {
    content = content.replace(
      /(import .* from '.*';\n)(?!import .*DBService)/,
      `$1import { DBService } from '../db/dbService.js';\n`
    );
  }

  // Remove CURATED_PATH and the try-catch block
  content = content.replace(/const CURATED_PATH = path\.join\(__dirname, '\.\.\/data\/curatedRadios\.json'\);\n\n\/\/ Carregar catálogo curado em memória\nlet curatedCatalog = \[\];\ntry \{\n\s*curatedCatalog = JSON\.parse\(fs\.readFileSync\(CURATED_PATH, 'utf-8'\)\);\n\} catch \(err\) \{\n\s*console\.error\('Erro ao carregar curatedRadios\.json:', err\.message\);\n\s*curatedCatalog = \[\];\n\}\n/g, '');
  
  content = content.replace(/const CURATED_PATH = path\.join\(__dirname, '\.\.\/data\/curatedRadios\.json'\);\n\nlet curatedCatalog = \[\];\ntry \{\n\s*curatedCatalog = JSON\.parse\(fs\.readFileSync\(CURATED_PATH, 'utf-8'\)\);\n\} catch \(err\) \{\n\s*curatedCatalog = \[\];\n\}\n/g, '');

  content = content.replace(/curatedCatalog/g, '(await DBService.getAllRadios())');
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Patched ${file}`);
}
