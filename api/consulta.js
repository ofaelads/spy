const ALLOWED_ORIGINS = ['https://espiaoculto.com', 'https://espiao-zap.com.br'];

function setCors(res, origin) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  setCors(res, origin);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Apenas requisições POST são aceitas.' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    res.status(400).json({ error: 'JSON inválido.' });
    return;
  }

  if (!body.phone) {
    res.status(400).json({ error: 'Campo "phone" é obrigatório.' });
    return;
  }

  const phone = String(body.phone).replace(/\D/g, '');
  if (phone.length < 10) {
    res.status(400).json({ error: 'Número de telefone inválido.' });
    return;
  }

  const apiKey = process.env.RAPIDAPI_KEY || '';
  if (!apiKey) {
    console.error('RAPIDAPI_KEY não configurada');
    res.status(500).json({ error: 'API não configurada. Defina RAPIDAPI_KEY.' });
    return;
  }

  try {
    const response = await fetch(
      `https://whatsapp-data1.p.rapidapi.com/number/${phone}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'whatsapp-data1.p.rapidapi.com',
          'x-rapidapi-key': apiKey,
        },
      }
    );

    const data = await response.json().catch(() => ({}));
    res.status(response.ok ? 200 : response.status).json(data);
  } catch (err) {
    console.error('Erro na API externa:', err.message);
    res.status(500).json({ error: `Erro na API: ${err.message}` });
  }
}
