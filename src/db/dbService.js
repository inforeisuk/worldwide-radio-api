import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'radios.sqlite');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export class DBService {
  static db = null;

  /**
   * Inicializa a ligação à base de dados e cria a tabela se não existir
   */
  static async init() {
    if (this.db) return this.db;

    this.db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS radios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        streamUrl TEXT NOT NULL,
        homepage TEXT,
        logo TEXT,
        country TEXT,
        countryCode TEXT,
        continent TEXT,
        city TEXT,
        is_curated BOOLEAN DEFAULT 1,
        votes INTEGER DEFAULT 0,
        genres TEXT, -- JSON Array
        languages TEXT -- JSON Array
      )
    `);

    // Criar índices para acelerar as pesquisas (Top 10 Enterprise Performance)
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_country ON radios(countryCode)`);
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_continent ON radios(continent)`);
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_votes ON radios(votes DESC)`);

    return this.db;
  }

  /**
   * Devolve a ligação
   */
  static async getConnection() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  /**
   * Obtém todas as rádios formatadas como array de objetos (para compatibilidade legada)
   */
  static async getAllRadios() {
    const db = await this.getConnection();
    const rows = await db.all('SELECT * FROM radios ORDER BY votes DESC');
    return rows.map(r => ({
      ...r,
      is_curated: r.is_curated === 1,
      genres: r.genres ? JSON.parse(r.genres) : [],
      languages: r.languages ? JSON.parse(r.languages) : []
    }));
  }
}
