// A git server over HTTP for tests, in front of `git http-backend`: it answers 401 unless a request carries Basic
// credentials whose password `accepts` takes for the repository, as GitHub does with an installation token that
// expired or was never issued for that repository. Every password presented is recorded.
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';

export interface GitHttpServer {
  /** `http://127.0.0.1:<port>/<name>.git`. */
  url(name: string): string;
  /** Every password a request carried, with the repository it was for, in order. */
  readonly presented: { repo: string; password: string }[];
  close(): Promise<void>;
}

/** Creates `<root>/<name>.git`, a bare repository with one commit on `main`, that the server serves. */
export function makeServedRepo(root: string, name: string): void {
  const seed = path.join(root, `${name}-seed`);
  const run = (args: string[], cwd?: string) =>
    execFileSync('git', args, {
      cwd,
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' },
      stdio: 'pipe',
    });
  mkdirSync(seed, { recursive: true });
  run(['init', '--quiet', '--initial-branch=main', seed]);
  writeFileSync(path.join(seed, 'README.md'), `# ${name}\n`);
  run(['add', '.'], seed);
  run(
    [
      '-c',
      'user.name=Seed',
      '-c',
      'user.email=seed@example.com',
      '-c',
      'commit.gpgsign=false',
      'commit',
      '--quiet',
      '-m',
      'seed',
    ],
    seed,
  );
  run(['clone', '--quiet', '--bare', seed, path.join(root, `${name}.git`)]);
  run(['config', 'http.receivepack', 'true'], path.join(root, `${name}.git`));
}

export async function startGitHttpServer(
  root: string,
  accepts: (repo: string, password: string) => boolean,
): Promise<GitHttpServer> {
  const presented: { repo: string; password: string }[] = [];
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const repo = /^\/([^/]+\.git)\//u.exec(url.pathname)?.[1] ?? '';
    const header = request.headers.authorization ?? '';
    const basic = /^Basic (.+)$/u.exec(header)?.[1];
    const decoded =
      basic === undefined ? '' : Buffer.from(basic, 'base64').toString('utf8');
    const password = decoded.slice(decoded.indexOf(':') + 1);
    if (basic !== undefined) presented.push({ repo, password });
    if (basic === undefined || !accepts(repo, password)) {
      response.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="test"',
        'Content-Type': 'text/plain',
      });
      response.end('Invalid username or token.\n');
      return;
    }
    const backend = spawn('git', ['http-backend'], {
      env: {
        ...process.env,
        GIT_PROJECT_ROOT: root,
        GIT_HTTP_EXPORT_ALL: '1',
        PATH_INFO: url.pathname,
        QUERY_STRING: url.search.slice(1),
        REQUEST_METHOD: request.method ?? 'GET',
        CONTENT_TYPE: request.headers['content-type'] ?? '',
        HTTP_CONTENT_ENCODING: request.headers['content-encoding'] ?? '',
        REMOTE_USER: 'test',
        REMOTE_ADDR: '127.0.0.1',
        GIT_CONFIG_NOSYSTEM: '1',
      },
    });
    request.pipe(backend.stdin);
    const chunks: Buffer[] = [];
    backend.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    backend.on('close', () => {
      const output = Buffer.concat(chunks);
      const crlf = output.indexOf('\r\n\r\n');
      const split = crlf === -1 ? output.indexOf('\n\n') : crlf;
      const head = output.subarray(0, split).toString('utf8');
      const body = output.subarray(split + (crlf === -1 ? 2 : 4));
      let status = 200;
      const headers: Record<string, string> = {};
      for (const line of head.split(/\r?\n/u)) {
        const colon = line.indexOf(':');
        if (colon === -1) continue;
        const name = line.slice(0, colon).trim();
        const value = line.slice(colon + 1).trim();
        if (name.toLowerCase() === 'status')
          status = Number.parseInt(value, 10);
        else headers[name] = value;
      }
      response.writeHead(status, headers);
      response.end(body);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: (name) => `http://127.0.0.1:${port}/${name}.git`,
    presented,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
