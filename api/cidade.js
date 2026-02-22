/**
 * Geolocalização por IP (sem pedir permissão ao usuário).
 * Retorna cidade, região e lat/lon para persuasão e mapa.
 */

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
    return (first || '').trim();
  }
  return (req.socket && req.socket.remoteAddress) || '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const clientIp = getClientIp(req) || undefined;
  const url = clientIp
    ? `http://ip-api.com/json/${encodeURIComponent(clientIp)}?fields=status,city,regionName,country,lat,lon&lang=pt`
    : 'http://ip-api.com/json/?fields=status,city,regionName,country,lat,lon&lang=pt';

  try {
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await response.json().catch(() => ({}));

    if (data.status !== 'success') {
      res.status(200).json({
        cidade: null,
        regiao: null,
        pais: null,
        lat: null,
        lon: null,
      });
      return;
    }

    const city = (data.city || '').trim();
    const regionName = (data.regionName || '').trim();
    const country = (data.country || '').trim();

    res.status(200).json({
      cidade: city || null,
      regiao: regionName || null,
      pais: country || null,
      lat: data.lat != null ? data.lat : null,
      lon: data.lon != null ? data.lon : null,
      cidadeRegiao: city && regionName ? city + '/' + regionName : (city || regionName || null),
    });
  } catch (err) {
    console.error('cidade API error:', err.message);
    res.status(200).json({
      cidade: null,
      regiao: null,
      pais: null,
      lat: null,
      lon: null,
    });
  }
}
