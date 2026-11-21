import { DriveManager } from 'flydrive';
import { FSDriver } from 'flydrive/drivers/fs';
import { S3Driver } from 'flydrive/drivers/s3';
import { once } from 'node:events';
import { createServer, type IncomingHttpHeaders } from 'node:http';
import { Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';

import {
  assertDefaultDisk,
  createDriveManager,
  type AppDriveConfig,
} from '../src/index.js';

describe('createDriveManager', () => {
  it('maps declarative drive config to Flydrive services', async () => {
    const manager = createDriveManager(createConfig(), {
      fakes: {
        location: '/tmp/fakes',
      },
    });

    expect(manager).toBeInstanceOf(DriveManager);

    const publicDriver = manager.use('public').driver as FSDriver;
    const s3Driver = manager.use('s3').driver as S3Driver;

    expect(publicDriver).toBeInstanceOf(FSDriver);
    expect(publicDriver.options.location).toBe('/tmp/storage/public');
    expect(await publicDriver.getUrl('a b.txt')).toBe('/storage/a%20b.txt');

    expect(s3Driver).toBeInstanceOf(S3Driver);
    expect(s3Driver.options).toEqual({
      bucket: 'portal-assets',
      region: 'ap-southeast-1',
      endpoint: 'https://s3.example.com',
      cdnUrl: 'https://cdn.example.com',
      forcePathStyle: true,
      supportsACL: false,
      encryption: 'AES256',
      credentials: {
        accessKeyId: 'access-key',
        secretAccessKey: 'secret-key',
      },
      visibility: 'private',
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  });

  it('uses provider credentials when explicit S3 credentials are missing', () => {
    const manager = createDriveManager({
      default: 's3',
      disks: {
        s3: {
          driver: 's3',
          bucket: 'portal-assets',
          region: 'ap-southeast-1',
          forcePathStyle: false,
          supportsACL: true,
          credentials: {},
          visibility: 'private',
        },
      },
    });

    const s3Driver = manager.use('s3').driver as S3Driver;

    expect(s3Driver.options).not.toHaveProperty('credentials');
  });

  it('uploads a stream of unknown length without optional checksum framing', async () => {
    vi.stubEnv('AWS_REQUEST_CHECKSUM_CALCULATION', 'WHEN_SUPPORTED');
    vi.stubEnv('AWS_RESPONSE_CHECKSUM_VALIDATION', 'WHEN_SUPPORTED');

    let headers: IncomingHttpHeaders | undefined;
    let method: string | undefined;
    let url: string | undefined;
    const chunks: Buffer[] = [];
    const server = createServer((request, response) => {
      headers = request.headers;
      method = request.method;
      url = request.url;
      request.on('data', (chunk: Buffer) => chunks.push(chunk));
      request.on('end', () => {
        response.writeHead(200, { ETag: '"test-etag"' });
        response.end();
      });
    });

    try {
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Expected a TCP server address.');
      }
      const config = createConfig();
      const disk = config.disks.s3;
      if (disk.driver !== 's3') {
        throw new Error('Expected an S3 disk.');
      }
      disk.endpoint = `http://127.0.0.1:${address.port}`;
      const manager = createDriveManager(config);
      const stream = Readable.from(
        (async function* () {
          yield Buffer.from('streamed ');
          yield Buffer.from('upload');
        })(),
        { objectMode: false },
      );

      await manager.use('s3').putStream('uploads/stream.txt', stream);

      expect(method).toBe('PUT');
      expect(url).toMatch(/^\/portal-assets\/uploads\/stream.txt(?:\?|$)/);
      expect(Buffer.concat(chunks).toString()).toBe('streamed upload');
      expect(headers).not.toHaveProperty('content-length');
      expect(headers).not.toHaveProperty('x-amz-decoded-content-length');
      expect(headers).not.toHaveProperty('x-amz-trailer');
      expect(headers?.['content-encoding']).not.toBe('aws-chunked');
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      vi.unstubAllEnvs();
    }
  });

  it('throws when the default disk is missing', () => {
    expect(() =>
      createDriveManager({
        default: 'missing',
        disks: {},
      }),
    ).toThrow('Default drive disk "missing" is not configured.');
  });
});

describe('assertDefaultDisk', () => {
  it('accepts a configured default disk', () => {
    expect(() => assertDefaultDisk(createConfig())).not.toThrow();
  });
});

function createConfig(): AppDriveConfig {
  return {
    default: 'public',
    disks: {
      public: {
        driver: 'fs',
        location: '/tmp/storage/public',
        visibility: 'public',
        url: '/storage',
      },
      s3: {
        driver: 's3',
        bucket: 'portal-assets',
        region: 'ap-southeast-1',
        endpoint: 'https://s3.example.com',
        cdnUrl: 'https://cdn.example.com',
        forcePathStyle: true,
        supportsACL: false,
        encryption: 'AES256',
        credentials: {
          accessKeyId: 'access-key',
          secretAccessKey: 'secret-key',
        },
        visibility: 'private',
      },
    },
  };
}
