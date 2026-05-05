const SUPABASE_URL = 'https://uvajwschjealpnueubhk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_59I629myHvGoBexlYkKJdw_GmuszA1H';

const TABLE_NAME = 'rankings';
const API_URL = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}`;

const HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export async function fetchRanking(limit = 10) {
  try {
    const url = `${API_URL}?select=*&order=total_time_ms.asc&limit=${limit}`;
    const response = await fetch(url, { headers: HEADERS });

    if (!response.ok) {
      console.warn('Erro ao buscar ranking:', response.status);
      return [];
    }

    const data = await response.json();
    return data.map(entry => ({
      name: entry.name,
      totalTime: Number(entry.total_time_ms),
      bestLap: Number(entry.best_lap_ms),
      lapTimes: entry.lap_times,
      date: entry.created_at,
    }));
  } catch (err) {
    console.warn('Falha ao conectar ao Supabase:', err.message);
    return [];
  }
}

export async function submitToRanking(name, totalTimeMs, lapTimes) {
  const cleanName = (name || 'PILOTO').substring(0, 12).toUpperCase();
  const bestLap = Math.min(...lapTimes);

  const payload = {
    name: cleanName,
    total_time_ms: Math.round(totalTimeMs),
    best_lap_ms: Math.round(bestLap),
    lap_times: lapTimes,
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { ...HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn('Erro ao salvar ranking:', response.status);
      return { success: false, position: null };
    }

    const ranking = await fetchRanking(10);
    const position = ranking.findIndex(e =>
      e.name === cleanName && Math.round(e.totalTime) === Math.round(totalTimeMs)
    );

    return {
      success: true,
      position: position >= 0 ? position + 1 : null,
    };
  } catch (err) {
    console.warn('Falha ao enviar ranking:', err.message);
    return { success: false, position: null };
  }
}

export async function checkConnection() {
  try {
    const response = await fetch(`${API_URL}?select=id&limit=1`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
