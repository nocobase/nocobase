import http from 'node:http';
import process from 'node:process';
import console from 'node:console';
import { URL } from 'node:url';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

const repository = path.resolve(import.meta.dirname, '../../../../../..');
const dist = path.join(repository, '.tmp/mail-issue7-browser/dist');
const port = Number(process.env.MAIL_WORKSPACE_BROWSER_PORT ?? 59114);
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  // Never proxy to a real application/mailbox. All APIs must be intercepted by the test.
  if (url.pathname.startsWith('/main/api/')) {
    response.writeHead(501, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({
        error: {
          code: 'UNIMPLEMENTED',
          status: 501,
          reason: 'FIXTURE_API_NOT_INTERCEPTED',
          domain: 'mail',
          message: 'This static fixture requires test API interception.',
        },
      }),
    );
    return;
  }
  try {
    const relative = url.pathname.startsWith('/main/assets/')
      ? url.pathname.slice('/main/'.length)
      : 'index.html';
    const target = path.resolve(dist, relative);
    if (!target.startsWith(`${dist}${path.sep}`))
      throw new Error('Invalid asset path');
    const data = await readFile(target);
    response.writeHead(200, {
      'content-type': target.endsWith('.js')
        ? 'text/javascript'
        : target.endsWith('.css')
          ? 'text/css'
          : 'text/html',
      'cache-control': 'no-store',
    });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end('Fixture asset not found');
  }
});
server.listen(port, '127.0.0.1', () =>
  console.log(`Mail production fixture: http://127.0.0.1:${port}/main/mail`),
);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.closeAllConnections();
    server.close(() => process.exit(0));
  });
}
