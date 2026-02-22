/**
 * Serverless: consulta status de uma transação Blackcat (para polling no checkout).
 * Docs: https://docs.blackcatpagamentos.online/
 */

const BLACKCAT_BASE = 'https://api.blackcatpagamentos.online/api';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Método não permitido.' });
    return;
  }

  const apiKey = process.env.BLACKCAT_API_KEY || '';
  if (!apiKey) {
    res.status(500).json({ success: false, message: 'Gateway não configurado.' });
    return;
  }

  const transactionId = req.query.transactionId || req.query.id || '';
  if (!transactionId) {
    res.status(400).json({ success: false, message: 'transactionId é obrigatório.' });
    return;
  }

  try {
    const response = await fetch(
      `${BLACKCAT_BASE}/sales/${encodeURIComponent(transactionId)}/status`,
      {
        method: 'GET',
        headers: { 'X-API-Key': apiKey },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({
        success: false,
        message: data.message || data.error || 'Transação não encontrada.',
      });
      return;
    }

    if (!data.success) {
      res.status(200).json({ success: false, data: data.data, message: data.message });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        transactionId: data.data?.transactionId,
        status: data.data?.status,
        paidAt: data.data?.paidAt,
      },
    });
  } catch (err) {
    console.error('Blackcat status error:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao consultar status.',
    });
  }
}
