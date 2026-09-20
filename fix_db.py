import re

with open("src/db/dbService.js", "r") as f:
    js = f.read()

replacement = """
    // Criar índices para acelerar as pesquisas (Top 10 Enterprise Performance)
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_country ON radios(countryCode)`);
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_continent ON radios(continent)`);
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_votes ON radios(votes DESC)`);

    // Auto-migrate se a DB estiver vazia
    const countRow = await this.db.get('SELECT COUNT(*) as count FROM radios');
    if (countRow && countRow.count === 0) {
      console.log('🔄 A base de dados SQLite está vazia. Iniciando auto-migração a partir de JSON...');
      try {
        const jsonPath = path.join(__dirname, '../../src/data/curatedRadios.json');
        if (fs.existsSync(jsonPath)) {
          const rawData = fs.readFileSync(jsonPath, 'utf-8');
          const radios = JSON.parse(rawData);
          const stmt = await this.db.prepare(`
            INSERT INTO radios (id, name, streamUrl, homepage, logo, country, countryCode, continent, city, is_curated, votes, genres, languages)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
          `);
          
          let count = 0;
          for (const r of radios) {
            await stmt.run(
              r.id, r.name, r.streamUrl, r.homepage, r.logo, r.country, r.countryCode, r.continent, r.city, r.votes || 0,
              JSON.stringify(r.genres || []), JSON.stringify(r.languages || [])
            );
            count++;
          }
          await stmt.finalize();
          console.log(`✅ Auto-migração concluída! Inseridas ${count} rádios em SQLite.`);
        } else {
          console.warn('⚠️ O ficheiro JSON original não foi encontrado. A BD continuará vazia.');
        }
      } catch (err) {
        console.error('❌ Erro na auto-migração:', err);
      }
    }

    return this.db;
"""

js = re.sub(r"    // Criar índices.*?return this\.db;", replacement, js, flags=re.DOTALL)

with open("src/db/dbService.js", "w") as f:
    f.write(js)
