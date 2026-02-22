/**
 * Geolocalização por IP (sem pedir permissão ao usuário).
 * Usa três provedores e escolhe por MAJORIA: o estado que mais aparecer
 * ganha; entre os que têm esse estado, preferimos o com cidade mais específica.
 * Assim evitamos pegar Fortaleza ou outro estado sozinho quando os outros dois
 * concordam (ex.: MS).
 */

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
    return (first || '').trim();
  }
  return (req.socket && req.socket.remoteAddress) || '';
}

/** Chave normalizada do estado para votação (evita SP vs São Paulo). */
function chaveEstado(regiao) {
  if (!regiao) return '';
  const r = (regiao || '').trim().toLowerCase();
  const map = {
    sp: 'são paulo', 'são paulo': 'são paulo', 'sao paulo': 'são paulo',
    ms: 'mato grosso do sul', 'mato grosso do sul': 'mato grosso do sul',
    mg: 'minas gerais', 'minas gerais': 'minas gerais',
    rj: 'rio de janeiro', 'rio de janeiro': 'rio de janeiro',
    pr: 'paraná', 'paraná': 'paraná', 'parana': 'paraná',
    rs: 'rio grande do sul', 'rio grande do sul': 'rio grande do sul',
    sc: 'santa catarina', 'santa catarina': 'santa catarina',
    ba: 'bahia', 'bahia': 'bahia',
    ce: 'ceará', 'ceará': 'ceará', 'ceara': 'ceará',
    pe: 'pernambuco', 'pernambuco': 'pernambuco',
    go: 'goiás', 'goiás': 'goiás', 'goias': 'goiás',
    df: 'distrito federal', 'distrito federal': 'distrito federal',
  };
  return map[r] || r;
}

/** Retorna true se o resultado parece genérico (cidade = estado). */
function ehGenerico(cidade, regiao) {
  if (!cidade || !regiao) return true;
  const c = (cidade || '').trim().toLowerCase();
  const r = (regiao || '').trim().toLowerCase();
  if (c === r) return true;
  if (c.length < 3) return true;
  return false;
}

/**
 * Escolhe o resultado pela maioria do estado entre os 3 provedores.
 * Se houver empate, usa o que tiver cidade mais específica (não genérica).
 */
function escolherPorMajoria(results) {
  if (results.length === 0) return null;
  if (results.length === 1) return results[0];

  const votos = {};
  for (const r of results) {
    const key = chaveEstado(r.regiao);
    if (!key) continue;
    votos[key] = (votos[key] || 0) + 1;
  }
  const estadoGanhador = Object.entries(votos).sort((a, b) => b[1] - a[1])[0];
  const estadoKey = estadoGanhador ? estadoGanhador[0] : null;

  const candidatos = estadoKey
    ? results.filter((r) => chaveEstado(r.regiao) === estadoKey)
    : results;

  let best = candidatos[0];
  for (let i = 1; i < candidatos.length; i++) {
    const a = best;
    const b = candidatos[i];
    const genA = ehGenerico(a.cidade, a.regiao);
    const genB = ehGenerico(b.cidade, b.regiao);
    if (!genA && genB) continue;
    if (genA && !genB) {
      best = b;
      continue;
    }
    if (a.cidade && !b.cidade) continue;
    if (!a.cidade && b.cidade) best = b;
  }
  return best;
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

    const best = escolherPorMajoria(results);

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
