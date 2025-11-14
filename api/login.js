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
  "João": "b5e1bc391d22e5a9a579f8cf93c9ad5f8bec1a26b5a3f6376d7d84729ee5ae33",
  "Maria": "98af8313056e4f8723012924a8b0d3ebeaa93d433127a3dd718cebd44ee61171",
  "Pedro": "9058a3f82d51b846c33711a39fa2f3f8b4912892836dddb7fb6d63171c032a28",
  "felipe_silva": "a4f817df4b1da736aedd02b054465540f4f08001428bfa498a0acab082cfaf58",
  "vagner lovison": "b47ef06291e0f16438bfe99faf88ce7f396a02080ea9876a392a4f5849232004",
  "bruno souza martins": "09d371ccdaa58e47ec0faaefe0f3a0eb96e3e7b913c670b0cf92eb8015360791",
  "bruno santos": "b8ac46d9e6ab07fc97028cec7a7a68b9ac22abd752f8fa0687956e0d8816fbe5",
  "vinicius": "b7b5c8e7d6fd4ac8b4155fdfaaf49ef7ecb895d2a63886956ceaa4dfcecdf135",
  "felipedarafaela": "02d0016e52939f5172f1627a47a4ccaeddcdc3656e11f58c48aa24b0902ffdcc",
  "marcos vinicius": "5bdb2d467d65c00a22c2931b511aec7f55066fba6dce3e54d997caabf686cc4e",
  "murilovasconcelos": "2c53a252c7d7ea5d2f3187b3da3af9613b5984e8e3906e04778307e75d32fe54",
  
  
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
