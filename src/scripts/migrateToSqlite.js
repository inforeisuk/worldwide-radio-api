import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DBService } from '../db/dbService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CURATED_PATH = path.join(__dirname, '../data/curatedRadios.json');

async function migrate() {
  console.log('🔄 Iniciando migração de JSON para SQLite...');
  
  if (!fs.existsSync(CURATED_PATH)) {
    console.error('❌ Erro: curatedRadios.json não encontrado!');
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(CURATED_PATH, 'utf-8'));
  const db = await DBService.getConnection();

  console.log(`📦 Encontradas ${catalog.length} estações no JSON.`);
  
  let success = 0;
  let errors = 0;

  // Iniciar transação para garantir que é rápido e seguro
  await db.exec('BEGIN TRANSACTION');

  try {
    for (const radio of catalog) {
      await db.run(
        `INSERT OR REPLACE INTO radios (
          id, name, streamUrl, homepage, logo, country, countryCode, continent, city, is_curated, votes, genres, languages
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          radio.id,
          radio.name,
          radio.streamUrl,
          radio.homepage || null,
          radio.logo || null,
          radio.country || null,
          radio.countryCode || null,
          radio.continent || null,
          radio.city || null,
          1, // is_curated = true
          radio.votes || 0,
          JSON.stringify(radio.genres || []),
          JSON.stringify(radio.languages || [])
        ]
      );
      success++;
    }
    await db.exec('COMMIT');
    console.log(`✅ Migração concluída com sucesso! ${success} estações importadas.`);
  } catch (err) {
    await db.exec('ROLLBACK');
    console.error('❌ Erro durante a migração, transação revertida:', err.message);
    errors++;
  }

  process.exit(errors > 0 ? 1 : 0);
}

migrate();
