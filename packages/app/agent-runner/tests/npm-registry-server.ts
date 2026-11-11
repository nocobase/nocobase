// A local npm registry for tests: packuments and tarballs of `1.0.0` of each package it is given, every request
// recorded. With a token it answers 404 to a request without `Bearer <token>`, as NocoBase's private registry does.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';

export interface Seen {
  readonly url: string;
  readonly auth: string | undefined;
}

/** A package's tarball, as `npm pack` makes one. */
function tarball(scratch: string, name: string, version: string): Buffer {
  const staging = path.join(scratch, 'staging', `${name}-${version}`);
  mkdirSync(path.join(staging, 'package'), { recursive: true });
  writeFileSync(
    path.join(staging, 'package', 'package.json'),
    JSON.stringify({ name, version }),
  );
  const file = path.join(staging, 'out.tgz');
  execFileSync('tar', ['-czf', file, '-C', staging, 'package']);
  return readFileSync(file);
}

export class Registry {
  readonly seen: Seen[] = [];
  private readonly packages = new Map<string, Buffer>();
  private server: http.Server | undefined;
  url = '';

  constructor(
    scratch: string,
    names: readonly string[],
    /** Answers 404 to a request without `Bearer <token>`, as NocoBase's private registry does. */
    private readonly token?: string,
  ) {
    for (const name of names)
      this.packages.set(name, tarball(scratch, name, '1.0.0'));
  }

  async start(): Promise<void> {
    this.server = http.createServer((request, response) => {
      const url = decodeURIComponent(request.url ?? '/');
      this.seen.push({ url, auth: request.headers.authorization });
      if (
        this.token !== undefined &&
        request.headers.authorization !== `Bearer ${this.token}`
      ) {
        response.writeHead(404).end('{}');
        return;
      }
      const tgz = /^\/(.+)\/-\/.+\.tgz$/u.exec(url);
      const name = tgz ? tgz[1]! : url.slice(1);
      const bytes = this.packages.get(name);
      if (bytes === undefined) {
        response.writeHead(404).end('{}');
        return;
      }
      if (tgz) {
        response.writeHead(200).end(bytes);
        return;
      }
      const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
      response.writeHead(200, { 'content-type': 'application/json' }).end(
        JSON.stringify({
          name,
          'dist-tags': { latest: '1.0.0' },
          versions: {
            '1.0.0': {
              name,
              version: '1.0.0',
              dist: {
                tarball: `${this.url}${name}/-/${name.split('/').pop()}-1.0.0.tgz`,
                integrity,
              },
            },
          },
        }),
      );
    });
    await new Promise<void>((resolve) =>
      this.server!.listen(0, '127.0.0.1', resolve),
    );
    this.url = `http://127.0.0.1:${(this.server!.address() as AddressInfo).port}/`;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => this.server!.close(() => resolve()));
  }
}
