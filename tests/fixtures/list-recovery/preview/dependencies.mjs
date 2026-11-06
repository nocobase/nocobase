import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Read-only transport for the exact frozen candidate dependency, not an upgrade registry.
// All ordinary dependencies retain their public npm identities and lockfile integrities.
export async function serveCandidate(root, manifest) {
  const candidate = manifest.candidates.find(
    (item) => item.name === '@nocobase/app-skills',
  );
  const bytes = await readFile(path.join(root, 'skills-combined.tgz'));
  if (
    `sha512-${createHash('sha512').update(bytes).digest('base64')}` !==
    candidate.integrity
  )
    throw Error('Candidate dependency integrity mismatch');
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname.includes('upgrade.716.2')) {
      if (
        url.pathname !==
        `/@nocobase/app-skills/-/app-skills-${candidate.version}.tgz`
      ) {
        response.writeHead(404).end();
        return;
      }
      response
        .writeHead(200, { 'content-type': 'application/octet-stream' })
        .end(bytes);
    } else
      response
        .writeHead(302, {
          location: `https://registry.npmjs.org${url.pathname}${url.search}`,
        })
        .end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
