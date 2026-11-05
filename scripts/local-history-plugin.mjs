import { readFile } from 'node:fs/promises';
export default {
  name: 'private-local-history',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      let path; try { path = decodeURIComponent((req.url || '').split('?')[0]); } catch { res.statusCode = 400; res.end(); return; }
      if (path !== '/__local-history') return next();
      const host = req.headers.host || '';
      const origin = req.headers.origin;
      if (!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress || '') || !/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host) || (origin && origin !== `http://${host}`) || req.method !== 'GET' || req.headers['sec-fetch-site'] === 'cross-site') { res.statusCode = 403; res.end(); return; }
      try { const data = await readFile(new URL('../local/history.json', import.meta.url)); res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store'); res.end(data); } catch { res.statusCode = 404; res.end('Local history unavailable'); }
    });
  },
};
