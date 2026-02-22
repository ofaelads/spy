/**
 * Serverless: cria venda PIX via Blackcat e retorna QR Code + copia e cola.
 * Docs: https://docs.blackcatpagamentos.online/
 */

const BLACKCAT_BASE = 'https://api.blackcatpagamentos.online/api';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Método não permitido.' });
    return;
  }

  const apiKey = process.env.BLACKCAT_API_KEY || '';
  if (!apiKey) {
    console.error('BLACKCAT_API_KEY não configurada');
    res.status(500).json({ success: false, message: 'Gateway de pagamento não configurado.' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    res.status(400).json({ success: false, message: 'JSON inválido.' });
    return;
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').replace(/\D/g, '');
  const cpf = String(body.cpf || body.document || '').replace(/\D/g, '');
  const amount = Math.round(Number(body.amount) || 4990);
  const itemTitle = String(body.itemTitle || 'Acesso Total - Relatório Completo').trim();

  if (!name || !email || !phone || cpf.length !== 11) {
    res.status(400).json({
      success: false,
      message: 'Preencha nome, e-mail, telefone e CPF (11 dígitos).',
    });
    return;
  }

  const payload = {
    amount: Math.max(100, amount),
    currency: 'BRL',
    paymentMethod: 'pix',
    items: [
      {
        title: itemTitle,
        unitPrice: Math.max(100, amount),
        quantity: 1,
        tangible: false,
      },
    ],
    customer: {
      name,
      email,
      phone,
      document: {
        number: cpf,
        type: 'cpf',
      },
    },
    pix: {
      expiresInDays: 1,
    },
  };

  if (body.postbackUrl) payload.postbackUrl = body.postbackUrl;
  if (body.externalRef) payload.externalRef = body.externalRef;

  try {
    const response = await fetch(`${BLACKCAT_BASE}/sales/create-sale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({
        success: false,
        message: data.message || data.error || 'Erro ao gerar PIX.',
        error: data.error,
      });
      return;
    }

    if (!data.success || !data.data) {
      res.status(500).json({
        success: false,
        message: data.message || 'Resposta inválida do gateway.',
      });
      return;
    }

    const { transactionId, paymentData, status, invoiceUrl } = data.data;
    const copyPaste = paymentData?.copyPaste ?? paymentData?.copy_paste ?? paymentData?.copiaECola ?? paymentData?.pixCopiaECola ?? null;
    res.status(200).json({
      success: true,
      data: {
        transactionId,
        status,
        invoiceUrl,
        qrCodeBase64: paymentData?.qrCodeBase64 || null,
        copyPaste,
        expiresAt: paymentData?.expiresAt || null,
      },
    });
  } catch (err) {
    console.error('Blackcat create-sale error:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao comunicar com o gateway. Tente novamente.',
    });
  }
}
