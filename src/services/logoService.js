import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { DBService } from '../db/dbService.js';
const LOGOS_DIR = path.join(__dirname, '../public/logos');

if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

/**
 * Cores de gradiente por país para badges SVG
 */
const COUNTRY_GRADIENTS = {
  PT: ['#047857', '#b91c1c'], // Verde e Vermelho de Portugal
  LU: ['#0284c7', '#ef4444'], // Azul e Vermelho do Luxemburgo
  BR: ['#15803d', '#eab308'], // Verde e Amarelo do Brasil
  GB: ['#1e3a8a', '#dc2626'], // Azul e Vermelho do Reino Unido
  US: ['#1d4ed8', '#b91c1c'], // Azul e Vermelho dos EUA
  ES: ['#b91c1c', '#eab308'], // Vermelho e Amarelo de Espanha
  FR: ['#1d4ed8', '#dc2626'], // Azul e Vermelho de França
  DE: ['#18181b', '#dc2626', '#eab308'], // Preto, Vermelho e Ouro da Alemanha
  DEFAULT: ['#0284c7', '#6366f1'] // Cyan para Índigo
};

export class LogoService {
  /**
   * Extrai o domínio limpo a partir de um URL
   */
  static extractDomain(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  }

  /**
   * Gera um logótipo vetorial SVG moderno dinâmico com iniciais e gradiente
   */
  static generateFallbackSvg(stationName = 'Radio', countryCode = 'DEFAULT') {
    const safeName = (stationName || 'Radio').trim();
    const initials = safeName
      .split(/\s+/)
      .map(w => w[0])
      .filter(c => /[A-Za-z0-9]/.test(c))
      .slice(0, 3)
      .join('')
      .toUpperCase() || 'RAD';

    const colors = COUNTRY_GRADIENTS[countryCode] || COUNTRY_GRADIENTS.DEFAULT;
    const col1 = colors[0];
    const col2 = colors[1] || colors[0];

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${col1}" />
            <stop offset="100%" stop-color="${col2}" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="28" fill="url(#grad)" />
        <circle cx="64" cy="44" r="14" fill="rgba(255,255,255,0.2)" />
        <path d="M50 44 A14 14 0 0 1 78 44" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
        <circle cx="64" cy="44" r="4" fill="#ffffff" />
        <text x="64" y="94" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">
          ${initials}
        </text>
      </svg>
    `.trim();
  }

  /**
   * Testa se um URL de imagem está acessível e retorna 200 OK
   */
  static async isImageAccessible(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Range': 'bytes=0-100'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);
      const ct = res.headers.get('content-type') || '';
      return res.ok && (ct.includes('image') || ct.includes('octet-stream') || res.status === 206);
    } catch {
      return false;
    }
  }

  /**
   * Resolve o melhor logótipo disponível para uma estação (com triplo fallback)
   */
  static async resolveLogo(radio) {
    if (!radio) return null;

    // 1. Verificar se o logótipo atual está acessível
    if (radio.logo && !radio.logo.includes('wikimedia.org') && !radio.logo.includes('seeklogo.com')) {
      const ok = await this.isImageAccessible(radio.logo);
      if (ok) return { url: radio.logo, type: 'original' };
    }

    // 2. Extrair favicon de alta resolução do domínio oficial da rádio
    const domain = this.extractDomain(radio.homepage);
    if (domain) {
      const googleLogoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      const ok = await this.isImageAccessible(googleLogoUrl);
      if (ok) return { url: googleLogoUrl, type: 'google_favicon' };
    }

    // 3. Fallback: Gerar SVG dinâmico elegante
    const svg = this.generateFallbackSvg(radio.name, radio.countryCode);
    return {
      svg,
      type: 'dynamic_svg'
    };
  }

  /**
   * Faz o download de um URL de imagem, converte para WebP (256x256) com o sharp,
   * e guarda na pasta pública local. Retorna o caminho relativo (ex: /logos/station.webp)
   */
  static async downloadAndOptimizeLogo(url, stationId) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (!res.ok) return null;

      const buffer = await res.arrayBuffer();
      
      const fileName = `${stationId}.webp`;
      const filePath = path.join(LOGOS_DIR, fileName);

      await sharp(Buffer.from(buffer))
        .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .webp({ quality: 85 })
        .toFile(filePath);

      return `/logos/${fileName}`;
    } catch (err) {
      console.error(`Erro ao otimizar logo para ${stationId}:`, err.message);
      return null;
    }
  }

  /**
   * Repara automaticamente todos os logótipos em curatedRadios.json
   */
  static async repairAllCuratedLogos() {
    let catalog = await DBService.getAllRadios();
    const db = await DBService.getConnection();

    const results = [];
    let repairedCount = 0;

    for (const radio of catalog) {
      const isWorking = await this.isImageAccessible(radio.logo);

      if (!isWorking || (radio.logo && (radio.logo.includes('wikimedia.org') || radio.logo.includes('seeklogo.com')))) {
        const domain = this.extractDomain(radio.homepage);
        let newLogo = null;

        if (domain) {
          const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
          const ok = await this.isImageAccessible(googleUrl);
          if (ok) {
            // Em vez de guardar o URL do Google, faz o download físico, converte para WebP e guarda localmente!
            const localPath = await this.downloadAndOptimizeLogo(googleUrl, radio.id);
            if (localPath) {
              newLogo = localPath;
            }
          }
        }

        if (!newLogo) {
          // Logótipo vetorial SVG como Data URI
          const svgString = this.generateFallbackSvg(radio.name, radio.countryCode);
          newLogo = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
        }

        const oldLogo = radio.logo;
        radio.logo = newLogo;
        await db.run('UPDATE radios SET logo = ? WHERE id = ?', [newLogo, radio.id]);
        repairedCount++;

        results.push({
          id: radio.id,
          name: radio.name,
          country: radio.country,
          oldLogo,
          newLogo,
          status: 'repaired'
        });
      }
    }

    // SQLite commited online during the loop

    return {
      success: true,
      totalChecked: catalog.length,
      totalRepaired: repairedCount,
      repairedStations: results
    };
  }

  /**
   * Atualiza manualmente o logótipo de uma estação específica
   */
  static async updateStationLogo(stationId, newLogoUrl) {
    if (!stationId || !newLogoUrl) {
      throw new Error('stationId e newLogoUrl são obrigatórios.');
    }

    const db = await DBService.getConnection();
    const result = await db.run('UPDATE radios SET logo = ? WHERE id = ? OR id = ?', [newLogoUrl, stationId, stationId.toLowerCase()]);

    if (result.changes === 0) {
      return null;
    }

    return { id: stationId, logo: newLogoUrl };
  }
}
