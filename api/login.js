// API de Login - Valida credenciais
// Endpoint: /api/login

const crypto = require('crypto');

// Hash SHA-256
function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// PARTICIPANTES COM CÓDIGOS HASHEADOS
// IMPORTANTE: Nunca exponha os códigos originais!
const PARTICIPANTES_HASH = {
  "Felipe": "e0bebd22819993425814866b62701e2919ea26f1370499c1037b53b9d49c2c8a",
  
  
};

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
    const { nome, codigo } = req.body;

    if (!nome || !codigo) {
      return res.status(400).json({ error: 'Nome e código são obrigatórios' });
    }

    // Verificar se o participante existe
    if (!PARTICIPANTES_HASH[nome]) {
      return res.status(401).json({ error: 'Nome ou código inválido' });
    }

    // Hash do código fornecido
    const codigoHash = hashString(codigo);

    // Comparar com o hash armazenado
    if (PARTICIPANTES_HASH[nome] === codigoHash) {
      // Gerar token simples (em produção, use JWT)
      const token = crypto.randomBytes(32).toString('hex');
      
      return res.status(200).json({
        success: true,
        nome: nome,
        token: token,
        message: 'Login realizado com sucesso'
      });
    } else {
      return res.status(401).json({ error: 'Nome ou código inválido' });
    }

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
