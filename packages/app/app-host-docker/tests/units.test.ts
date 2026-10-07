import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_DOCKER_ENDPOINT,
  assertNoDockerConfig,
  detectDockerEndpoint,
  parseEndpoint,
} from '../src/config.js';
import { demuxLogs } from '../src/docker-api.js';
import { normalizeTime } from '../src/logs.js';
import { appSlug } from '../src/naming.js';
import { entrySize, readTarFile, tarArchive, tarEntries } from '../src/tar.js';

describe('settings', () => {
  it('refuses any environment setting', () => {
    expect(() => assertNoDockerConfig({})).not.toThrow();
    expect(() => assertNoDockerConfig({ endpoint: '/x.sock' })).toThrow(
      /Unknown setting endpoint/,
    );
  });

  it('parses the local socket and a socket proxy, nothing remote', () => {
    expect(parseEndpoint('/run/user/1000/docker.sock')).toEqual({
      kind: 'socket',
      socketPath: '/run/user/1000/docker.sock',
    });
    expect(parseEndpoint('unix:///var/run/docker.sock')).toEqual({
      kind: 'socket',
      socketPath: '/var/run/docker.sock',
    });
    expect(parseEndpoint('tcp://docker-socket-proxy:2375')).toEqual({
      kind: 'tcp',
      host: 'docker-socket-proxy',
      port: 2375,
    });
    expect(() => parseEndpoint('ssh://deploy@docker.example.com')).toThrow(
      /not supported/,
    );
    expect(() => parseEndpoint('https://docker.example.com')).toThrow(
      /not supported/,
    );
  });

  it('finds the endpoint as the docker CLI does', async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), 'docker-home-'));
    try {
      expect(detectDockerEndpoint({}, home)).toBe(DEFAULT_DOCKER_ENDPOINT);
      expect(
        detectDockerEndpoint({ DOCKER_HOST: 'unix:///tmp/d.sock' }, home),
      ).toBe('unix:///tmp/d.sock');
      const meta = path.join(
        home,
        '.docker/contexts/meta',
        createHash('sha256').update('orbstack').digest('hex'),
      );
      await mkdir(meta, { recursive: true });
      await writeFile(
        path.join(meta, 'meta.json'),
        JSON.stringify({
          Name: 'orbstack',
          Endpoints: {
            docker: { Host: 'unix:///Users/me/.orbstack/run/docker.sock' },
          },
        }),
      );
      await writeFile(
        path.join(home, '.docker/config.json'),
        JSON.stringify({ currentContext: 'orbstack' }),
      );
      expect(detectDockerEndpoint({}, home)).toBe(
        'unix:///Users/me/.orbstack/run/docker.sock',
      );
      expect(detectDockerEndpoint({ DOCKER_CONTEXT: 'default' }, home)).toBe(
        DEFAULT_DOCKER_ENDPOINT,
      );
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  });
});

describe('tar', () => {
  it('passes entries through and stops at the end-of-archive marker', async () => {
    const archive = tarArchive([
      { name: 'a.txt', content: 'hello' },
      { name: 'b.bin', content: Buffer.alloc(1500, 7) },
    ]);
    const chunks: Buffer[] = [];
    // Odd chunk sizes, to cross block boundaries.
    const source = Readable.from(
      Array.from({ length: Math.ceil(archive.length / 333) }, (_, index) =>
        archive.subarray(index * 333, (index + 1) * 333),
      ),
    );
    for await (const chunk of tarEntries(source as AsyncIterable<Buffer>))
      chunks.push(chunk);
    const passed = Buffer.concat(chunks);
    expect(passed.length).toBe(archive.length - 1024);
    expect(entrySize(passed.subarray(0, 512))).toBe(5);
    expect(
      (
        await readTarFile(
          Readable.from([archive]) as AsyncIterable<Buffer>,
          'b.bin',
        )
      )?.length,
    ).toBe(1500);
  });

  it('refuses a truncated archive', async () => {
    const archive = tarArchive([
      { name: 'a.txt', content: Buffer.alloc(2000) },
    ]).subarray(0, 1024);
    await expect(async () => {
      for await (const chunk of tarEntries(
        Readable.from([archive]) as AsyncIterable<Buffer>,
      ))
        void chunk;
    }).rejects.toThrow(/middle of an entry/);
  });
});

describe('helpers', () => {
  it('splits multiplexed logs that cross frame boundaries', () => {
    const frame = (type: number, text: string) => {
      const header = Buffer.alloc(8);
      header[0] = type;
      header.writeUInt32BE(Buffer.byteLength(text), 4);
      return Buffer.concat([header, Buffer.from(text)]);
    };
    const lines = demuxLogs(
      Buffer.concat([
        frame(1, '2026-10-02T00:00:00.1Z hel'),
        frame(1, 'lo\n'),
        frame(2, '2026-10-02T00:00:00.2Z oops\n'),
      ]),
    );
    expect(lines).toEqual([
      { stream: 'stdout', time: '2026-10-02T00:00:00.1Z', text: 'hello' },
      { stream: 'stderr', time: '2026-10-02T00:00:00.2Z', text: 'oops' },
    ]);
  });

  it('normalises timestamps so they sort', () => {
    expect(
      normalizeTime('2026-10-02T00:00:00.1Z') <
        normalizeTime('2026-10-02T00:00:00.123Z'),
    ).toBe(true);
  });

  it('keeps distinct App IDs distinct as Docker names', () => {
    expect(appSlug('fg-12--acme')).toBe('fg-12--acme');
    expect(appSlug('Shop')).not.toBe(appSlug('shop'));
    expect(appSlug('a_b')).toMatch(/^a-b-[0-9a-f]{6}$/);
  });
});
