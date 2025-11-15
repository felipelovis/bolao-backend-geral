// API de Salvamento - Proxy seguro para Apps Script
// Endpoint: /api/salvar

// Rate limiting simples em memória
const requestCounts = new Map();
const RATE_LIMIT = 100; // máximo de requisições
const RATE_WINDOW = 2 * 60 * 60 * 1000; // 1 hora em ms

function getRateLimitKey(ip) {
  return `${ip}-${Date.now() - (Date.now() % RATE_WINDOW)}`;
}

function checkRateLimit(ip) {
  const key = getRateLimitKey(ip);
  const count = requestCounts.get(key) || 0;
  
  if (count >= RATE_LIMIT) {
    return false;
  }
  
  requestCounts.set(key, count + 1);
  
  // Limpar entradas antigas
  if (requestCounts.size > 1000) {
    const cutoff = Date.now() - RATE_WINDOW;
    for (const [k, v] of requestCounts) {
      if (parseInt(k.split('-')[1]) < cutoff) {
        requestCounts.delete(k);
      }
    }
  }
  
  return true;
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Rate limiting por IP
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ 
        error: 'Muitas requisições. Tente novamente em 1 hora.',
        retryAfter: 3600 
      });
    }

    const { participante, palpites, token } = req.body;

    // Validações básicas
    if (!participante || !palpites) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    // Validar que palpites é um objeto
    if (typeof palpites !== 'object' || Array.isArray(palpites)) {
      return res.status(400).json({ error: 'Formato de palpites inválido' });
    }

    // Limitar número de palpites (proteção contra spam)
    if (Object.keys(palpites).length > 150) {
      return res.status(400).json({ error: 'Número excessivo de palpites' });
    }

    // Validar cada palpite
    for (const [idJogo, palpite] of Object.entries(palpites)) {
      if (typeof palpite.golsA !== 'number' || typeof palpite.golsB !== 'number') {
        return res.status(400).json({ error: 'Formato de palpite inválido' });
      }
      
      if (palpite.golsA < 0 || palpite.golsA > 20 || palpite.golsB < 0 || palpite.golsB > 20) {
        return res.status(400).json({ error: 'Valores de gols inválidos' });
      }
    }

    // URL do Google Apps Script (CONFIGURE AQUI!)
   const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbziUvAZPEKU8faBoGK6c1PF5li3bKajPMC6PoRFYHGnQ-Mz0C5Mt9U9EeiliWElUOc0/exec';
    if (APPS_SCRIPT_URL === 'SUA_URL_DO_APPS_SCRIPT_AQUI') {
      return res.status(500).json({ error: 'Apps Script URL não configurada' });
    }

    // Fazer requisição para o Apps Script
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        participante,
        palpites
      })
    });

    // Log da atividade
    console.log(`[${new Date().toISOString()}] ${participante} salvou ${Object.keys(palpites).length} palpites de IP ${ip}`);

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: 'Palpites salvos com sucesso',
        count: Object.keys(palpites).length
      });
    } else {
      throw new Error('Erro ao salvar no Google Sheets');
    }

  } catch (error) {
    console.error('Erro ao salvar palpites:', error);
    return res.status(500).json({ 
      error: 'Erro ao salvar palpites',
      details: error.message 
    });
  }
};
