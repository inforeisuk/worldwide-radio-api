import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LogoService } from '../services/logoService.js';
import { RadioBrowserService } from '../services/radioBrowserService.js';

import { DBService } from '../db/dbService.js';

export class LogoController {
  /**
   * Obtém o logótipo em alta resolução de uma emissora com auto-resolução inteligente
   * GET /api/radios/:id/logo
   */
  static async getStationLogo(req, res) {
    try {
      const { id } = req.params;

      // 1. Procurar no catálogo SQLite
      let catalog = await DBService.getAllRadios();
      let radio = catalog.find(r => r.id === id || r.id === id.toLowerCase());

      // 2. Se não encontrar no catálogo local, procurar no Radio-Browser global
      if (!radio) {
        radio = await RadioBrowserService.getByUuid(id);
      }

      if (!radio) {
        // Gera SVG padrão com o próprio ID se não encontrada
        const fallbackSvg = LogoService.generateFallbackSvg(id, 'DEFAULT');
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(fallbackSvg);
      }

      // 3. Resolver melhor logótipo com LogoService
      const logoResult = await LogoService.resolveLogo(radio);

      if (!logoResult || logoResult.type === 'dynamic_svg') {
        const svgContent = logoResult?.svg || LogoService.generateFallbackSvg(radio.name, radio.countryCode);
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.status(200).send(svgContent);
      }

      // 4. Se tiver URL direto ou Favicon de Alta Resolução, redireciona via HTTP 302
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.redirect(302, logoResult.url);
    } catch (err) {
      console.error('Erro em getStationLogo:', err);
      const errSvg = LogoService.generateFallbackSvg('Radio', 'DEFAULT');
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      return res.status(200).send(errSvg);
    }
  }

  /**
   * Dispara a rotina automática de reparação e auto-healing de todos os logótipos
   * POST /api/radios/repair-logos
   */
  static async repairCuratedLogos(req, res) {
    try {
      const result = await LogoService.repairAllCuratedLogos();
      return res.json({
        success: result.success,
        message: 'Rotina de reparação e auto-atualização de logótipos concluída.',
        totalChecked: result.totalChecked,
        totalRepaired: result.totalRepaired,
        repairedStations: result.repairedStations
      });
    } catch (err) {
      console.error('Erro ao reparar logótipos:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Falha ao executar a reparação automática de logótipos.'
      });
    }
  }

  /**
   * Atualiza ou adiciona manualmente o logótipo de uma estação
   * PUT /api/radios/:id/logo
   */
  static async updateStationLogo(req, res) {
    try {
      const { id } = req.params;
      const logoUrl = req.body?.logo || req.body?.logoUrl || req.query?.logo || req.query?.url;

      if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.startsWith('http')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Um URL de logótipo válido (começado por http:// ou https://) é obrigatório no corpo (body.logo) ou query param.'
        });
      }

      const updated = LogoService.updateStationLogo(id, logoUrl);

      if (!updated) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Emissora curada com ID "${id}" não encontrada no catálogo.`
        });
      }

      return res.json({
        success: true,
        message: `Logótipo da emissora "${updated.name}" atualizado com sucesso.`,
        station: updated
      });
    } catch (err) {
      console.error('Erro em updateStationLogo:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'Erro ao atualizar logótipo da emissora.'
      });
    }
  }
}
