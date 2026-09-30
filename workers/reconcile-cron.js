export const RECONCILE_TIMEOUT_MS = 150000;

export default {
  async scheduled(controller, env, ctx) {
    let url;
    try { url = new URL(env.RECONCILE_URL); } catch { throw new Error('RECONCILE_NOT_CONFIGURED'); }
    if (url.protocol !== 'https:' || url.username || url.password ||
        typeof env.RECONCILE_SECRET !== 'string' || env.RECONCILE_SECRET.length < 32) {
      throw new Error('RECONCILE_NOT_CONFIGURED');
    }

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), RECONCILE_TIMEOUT_MS);
    try {
      let response;
      try {
        response = await fetch(url.toString(), {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RECONCILE_SECRET}`, Accept: 'application/json' },
          signal: abort.signal
        });
      } catch {
        throw new Error(abort.signal.aborted ? 'RECONCILE_TIMEOUT' : 'RECONCILE_UNAVAILABLE');
      }
      if (!response.ok) throw new Error('RECONCILE_HTTP_ERROR');
      let result;
      try { result = await response.json(); } catch { throw new Error(abort.signal.aborted ? 'RECONCILE_TIMEOUT' : 'RECONCILE_INVALID_JSON'); }
      if (result?.ok !== true) throw new Error('RECONCILE_INVALID_RESPONSE');
      const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
      console.log(JSON.stringify({ checked: count(result.checked), busy: count(result.busy), errors: count(result.errors) }));
    } finally {
      clearTimeout(timer);
    }
  }
};
