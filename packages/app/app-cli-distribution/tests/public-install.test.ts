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
  stat,
  symlink,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { it, expect } from 'vitest';
import { publicInstallScript } from '../src/public-install.js';

const exec = promisify(execFile);
async function fixture(
  mode: 'ok' | 'checksum' | 'download' | 'invalid' | 'denied' = 'ok',
) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'public-cli-'));
  await mkdir(path.join(root, 'package/bin'), { recursive: true });
  await writeFile(path.join(root, 'package/bin/acme'), '#!/bin/sh\nexit 0\n');
  await chmod(path.join(root, 'package/bin/acme'), 0o755);
  await exec('tar', [
    '-czf',
    path.join(root, 'cli.tar.gz'),
    '-C',
    root,
    'package',
  ]);
  const bytes = await readFile(path.join(root, 'cli.tar.gz'));
  const requests: Array<{ path: string; headers: object }> = [];
  const server = createServer((req, res) => {
    requests.push({ path: req.url!, headers: req.headers });
    if (mode === 'denied') {
      res.writeHead(401).end();
      return;
    }
    if (req.url!.includes('/targets/')) {
      res.end(
        mode === 'invalid'
          ? 'version=../escape\n'
          : `version=1.0.0\nurl=/api/agents/dist/cli.tar.gz\nuniversal=true\nsha256=${mode === 'checksum' ? '0'.repeat(64) : createHash('sha256').update(bytes).digest('hex')}\n`,
      );
    } else if (mode === 'download') res.writeHead(500).end();
    else res.end(bytes);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/nested/main`;
  const script = path.join(root, 'install.sh');
  await writeFile(script, publicInstallScript({ cli: 'acme', server: url }));
  const prefix = path.join(root, 'prefix with "quotes"');
  const bin = path.join(root, "bin with 'quotes'");
  const run = (args: string[] = []) =>
    exec('sh', [script, '--prefix', prefix, '--bin-dir', bin, ...args], {
      cwd: root,
    });
  return {
    root,
    prefix,
    bin,
    url,
    script,
    run,
    requests,
    async close() {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await rm(root, { force: true, recursive: true });
    },
  };
}

it('installs into quoted paths, records valid JSON and never sends credentials or starts services', async () => {
  const f = await fixture();
  try {
    const script = await readFile(f.script, 'utf8');
    expect(script).not.toMatch(
      /--token|\$token|x-nocobase-download-token|register|acp service|--runner/,
    );
    await exec('sh', ['-n', f.script]);
    const { stdout } = await f.run();
    expect(stdout).toContain(`Next: acme login --server ${f.url}`);
    expect(await readlink(path.join(f.prefix, 'current'))).toBe(
      'versions/1.0.0',
    );
    expect(await readlink(path.join(f.bin, 'acme'))).toBe(
      path.join(f.prefix, 'current/bin/acme'),
    );
    expect(
      JSON.parse(await readFile(path.join(f.prefix, 'install.json'), 'utf8')),
    ).toEqual({
      prefix: f.prefix,
      binLink: path.join(f.bin, 'acme'),
      mode: 'cli',
    });
    expect(f.requests).toHaveLength(2);
    for (const request of f.requests) {
      expect(request.path).toMatch(/^\/nested\/main\/api\/agents\/dist\//u);
      expect(request.headers).not.toHaveProperty('authorization');
      expect(request.headers).not.toHaveProperty('x-nocobase-download-token');
    }
  } finally {
    await f.close();
  }
});

it('dry-run resolves but does not download, install, activate or claim success', async () => {
  const f = await fixture();
  try {
    const { stdout } = await f.run(['--dry-run']);
    expect(stdout).toContain('Dry run: no installation was changed.');
    expect(stdout).not.toContain('acme is installed:');
    expect(f.requests).toHaveLength(1);
    await expect(stat(f.prefix)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(stat(f.bin)).rejects.toMatchObject({ code: 'ENOENT' });
  } finally {
    await f.close();
  }
});

it.each(['checksum', 'download', 'invalid', 'denied'] as const)(
  'fails %s without activating a version',
  async (mode) => {
    const f = await fixture(mode);
    try {
      await expect(f.run()).rejects.toMatchObject({ code: 1 });
      await expect(stat(path.join(f.prefix, 'current'))).rejects.toMatchObject({
        code: 'ENOENT',
      });
      await expect(
        stat(path.join(f.prefix, 'install.json')),
      ).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await f.close();
    }
  },
);

it('preserves the previously active version on checksum failure', async () => {
  const f = await fixture('checksum');
  try {
    await mkdir(path.join(f.prefix, 'versions/0.9.0'), { recursive: true });
    await symlink('versions/0.9.0', path.join(f.prefix, 'current'));
    await expect(f.run()).rejects.toMatchObject({ code: 1 });
    expect(await readlink(path.join(f.prefix, 'current'))).toBe(
      'versions/0.9.0',
    );
  } finally {
    await f.close();
  }
});

it('uses exit 2 for invalid options/addresses without echoing credential values', async () => {
  const f = await fixture();
  try {
    for (const args of [
      ['--token', 'private-value'],
      ['--runner'],
      ['--server'],
      ['--server', 'http://user:private-value@localhost/main'],
    ]) {
      try {
        await f.run(args);
        throw new Error('Expected refusal');
      } catch (error) {
        expect(error).toMatchObject({ code: 2 });
        expect(String((error as { stderr: string }).stderr)).not.toContain(
          'private-value',
        );
      }
    }
    expect(f.requests).toHaveLength(0);
  } finally {
    await f.close();
  }
});
