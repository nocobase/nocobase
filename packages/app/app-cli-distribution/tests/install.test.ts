import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';
import { installScript } from '../src/install.js';
import { publicInstallScript } from '../src/public-install.js';

const exec = promisify(execFile);

it.each([{ public: true }, { public: false }])(
  'installs using the explicit public=$public policy',
  async (policy) => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'cli-install-policy-'));
    const requests: Array<{ url: string; credential: string | undefined }> = [];
    const server = createServer();
    try {
      await mkdir(path.join(root, 'package/bin'), { recursive: true });
      await writeFile(
        path.join(root, 'package/bin/acme'),
        '#!/bin/sh\nexit 0\n',
      );
      await chmod(path.join(root, 'package/bin/acme'), 0o755);
      const archive = path.join(root, 'cli.tar.gz');
      await exec('tar', ['-czf', archive, '-C', root, 'package']);
      const bytes = await readFile(archive);
      server.on('request', (req, res) => {
        requests.push({
          url: req.url!,
          credential: req.headers['x-nocobase-download-token'] as
            string | undefined,
        });
        if (
          !policy.public &&
          req.headers['x-nocobase-download-token'] !== 'test-token'
        ) {
          res.writeHead(401).end('Unauthorized');
        } else if (req.url!.includes('/targets/')) {
          res.end(
            `version=1.0.0\nurl=/api/agents/dist/cli.tar.gz\nsha256=${createHash('sha256').update(bytes).digest('hex')}\nuniversal=true\n`,
          );
        } else res.end(bytes);
      });
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve),
      );
      const address = server.address() as { port: number };
      const script = path.join(root, 'install.sh');
      const contents = (policy.public ? publicInstallScript : installScript)({
        cli: 'acme',
        server: `http://127.0.0.1:${address.port}/nested/main`,
      });
      await writeFile(script, contents);
      await exec('sh', ['-n', script]);
      const args = [
        script,
        '--prefix',
        path.join(root, 'installed'),
        '--bin-dir',
        path.join(root, 'bin'),
      ];
      if (!policy.public) {
        await expect(exec('sh', args)).rejects.toMatchObject({ code: 2 });
        expect(requests).toEqual([]);
        args.push('--token', 'test-token');
      } else {
        expect(contents).not.toMatch(
          /--token|x-nocobase-download-token|\$token/,
        );
        await expect(
          exec('sh', [...args, '--token', 'test-token']),
        ).rejects.toMatchObject({ code: 2 });
        expect(requests).toEqual([]);
      }
      await exec('sh', args);
      expect(await readlink(path.join(root, 'installed/current'))).toBe(
        'versions/1.0.0',
      );
      expect(
        JSON.parse(
          await readFile(path.join(root, 'installed/install.json'), 'utf8'),
        ).mode,
      ).toBe('cli');
      expect(requests).toHaveLength(2);
      expect(
        requests.every((req) =>
          req.url.startsWith('/nested/main/api/agents/dist/'),
        ),
      ).toBe(true);
      expect(requests.map((req) => req.credential)).toEqual(
        policy.public ? [undefined, undefined] : ['test-token', 'test-token'],
      );
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await rm(root, { recursive: true, force: true });
    }
  },
);

it('fails a public install on a protected response instead of retaining an existing installation', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cli-install-denied-'));
  const server = createServer((_req, res) =>
    res.writeHead(401).end('Sign in.'),
  );
  try {
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const { port } = server.address() as { port: number };
    const prefix = path.join(root, 'prefix');
    await mkdir(path.join(prefix, 'current/bin'), { recursive: true });
    await writeFile(
      path.join(prefix, 'current/bin/acme'),
      '#!/bin/sh\nexit 0\n',
    );
    await chmod(path.join(prefix, 'current/bin/acme'), 0o755);
    const script = path.join(root, 'install.sh');
    await writeFile(
      script,
      publicInstallScript({
        cli: 'acme',
        server: `http://127.0.0.1:${port}/main`,
      }),
    );
    await expect(
      exec('sh', [
        script,
        '--prefix',
        prefix,
        '--bin-dir',
        path.join(root, 'bin'),
      ]),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('answered 401'),
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(root, { recursive: true, force: true });
  }
});
