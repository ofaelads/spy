/**
 * Geolocalização por IP (sem pedir permissão ao usuário).
 * Usa três provedores e refina por estado: prefere resultado com cidade
 * mais específica e deprioritiza "São Paulo" quando outro estado aparecer.
 */

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
    return (first || '').trim();
  }
  return (req.socket && req.socket.remoteAddress) || '';
}

/** Retorna true se o resultado parece genérico (cidade = estado, ou só estado). */
function ehGenerico(cidade, regiao) {
  if (!cidade || !regiao) return true;
  const c = (cidade || '').trim().toLowerCase();
  const r = (regiao || '').trim().toLowerCase();
  if (c === r) return true;
  if (c.length < 3) return true;
  return false;
}

/** True se o estado é São Paulo (genérico para muitos IPs no Brasil). */
function ehEstadoSaoPaulo(regiao) {
  if (!regiao) return false;
  const r = (regiao || '').trim().toLowerCase();
  return r === 'são paulo' || r === 'sao paulo' || r === 'sp';
}

/**
 * Escolhe o melhor resultado: prefere não-genérico, depois prefere
 * qualquer estado que não seja São Paulo (refino por estado).
 */
function escolherMelhor(a, b) {
  const genA = ehGenerico(a.cidade, a.regiao);
  const genB = ehGenerico(b.cidade, b.regiao);
  if (!genA && genB) return a;
  if (genA && !genB) return b;
  if (a.cidade && !b.cidade) return a;
  if (!a.cidade && b.cidade) return b;
  const spA = ehEstadoSaoPaulo(a.regiao);
  const spB = ehEstadoSaoPaulo(b.regiao);
  if (spA && !spB) return b;
  if (!spA && spB) return a;
  return a.cidade ? a : b;
}

function normalizar(r) {
  if (!r || (!r.cidade && !r.regiao)) return null;
  return r;
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

  const clientIp = getClientIp(req) || '';
  const ip = clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1' ? clientIp : '';
  const ipEnc = ip ? encodeURIComponent(ip) : '';

  const fetches = [];

  if (ip) {
    fetches.push(
      fetch(
        `https://ip-api.com/json/${ipEnc}?fields=status,city,regionName,country,lat,lon&lang=pt`,
        { headers: { Accept: 'application/json' } }
      )
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          if (data.status !== 'success') return null;
          return normalizar({
            cidade: (data.city || '').trim() || null,
            regiao: (data.regionName || '').trim() || null,
            pais: (data.country || '').trim() || null,
            lat: data.lat != null ? data.lat : null,
            lon: data.lon != null ? data.lon : null,
          });
        })
        .catch(() => null)
    );
    fetches.push(
      fetch(`https://ipapi.co/${ipEnc}/json/`, { headers: { Accept: 'application/json' } })
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          const city = (data.city || '').trim() || null;
          const region = (data.region || '').trim() || null;
          if (!city && !region) return null;
          return normalizar({
            cidade: city,
            regiao: region || null,
            pais: (data.country_name || '').trim() || null,
            lat: data.latitude != null ? data.latitude : null,
            lon: data.longitude != null ? data.longitude : null,
          });
        })
        .catch(() => null)
    );
    fetches.push(
      fetch(`https://ipwho.is/${ipEnc}`, { headers: { Accept: 'application/json' } })
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          if (!data || !data.success) return null;
          const city = (data.city || '').trim() || null;
          const region = (data.region || '').trim() || null;
          return normalizar({
            cidade: city,
            regiao: region || null,
            pais: (data.country || '').trim() || null,
            lat: data.latitude != null ? data.latitude : null,
            lon: data.longitude != null ? data.longitude : null,
          });
        })
        .catch(() => null)
    );
  } else {
    fetches.push(
      fetch('https://ip-api.com/json/?fields=status,city,regionName,country,lat,lon&lang=pt', {
        headers: { Accept: 'application/json' },
      })
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          if (data.status !== 'success') return null;
          return normalizar({
            cidade: (data.city || '').trim() || null,
            regiao: (data.regionName || '').trim() || null,
            pais: (data.country || '').trim() || null,
            lat: data.lat != null ? data.lat : null,
            lon: data.lon != null ? data.lon : null,
          });
        })
        .catch(() => null)
    );
    fetches.push(
      fetch('https://ipapi.co/json/', { headers: { Accept: 'application/json' } })
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          const city = (data.city || '').trim() || null;
          const region = (data.region || '').trim() || null;
          if (!city && !region) return null;
          return normalizar({
            cidade: city,
            regiao: region || null,
            pais: (data.country_name || '').trim() || null,
            lat: data.latitude != null ? data.latitude : null,
            lon: data.longitude != null ? data.longitude : null,
          });
        })
        .catch(() => null)
    );
    fetches.push(
      fetch('https://ipwho.is/', { headers: { Accept: 'application/json' } })
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          if (!data || !data.success) return null;
          const city = (data.city || '').trim() || null;
          const region = (data.region || '').trim() || null;
          return normalizar({
            cidade: city,
            regiao: region || null,
            pais: (data.country || '').trim() || null,
            lat: data.latitude != null ? data.latitude : null,
            lon: data.longitude != null ? data.longitude : null,
          });
        })
        .catch(() => null)
    );
  }

  try {
    const settled = await Promise.all(fetches);
    const results = settled.filter((r) => r != null);

    let best = results[0] || null;
    for (let i = 1; i < results.length; i++) {
      best = escolherMelhor(best, results[i]);
    }

    if (!best) {
      res.status(200).json({
        cidade: null,
        regiao: null,
        pais: null,
        lat: null,
        lon: null,
        cidadeRegiao: null,
      });
      return;
    }

    const city = best.cidade || null;
    const regiao = best.regiao || null;
    const cidadeRegiao = city && regiao ? city + '/' + regiao : city || regiao || null;

    res.status(200).json({
      cidade: city,
      regiao: regiao,
      pais: best.pais || null,
      lat: best.lat,
      lon: best.lon,
      cidadeRegiao: cidadeRegiao,
    });
  } catch (err) {
    console.error('cidade API error:', err.message);
    res.status(200).json({
      cidade: null,
      regiao: null,
      pais: null,
      lat: null,
      lon: null,
      cidadeRegiao: null,
    });
  }
}
