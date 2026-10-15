import { createRequire } from 'node:module';
import { Readable } from 'node:stream';

import { vi } from 'vitest';

import {
  createDriveManager,
  type OssDriveDiskConfig,
} from '../../src/index.js';

const require = createRequire(import.meta.url);
const sdkRequire = createRequire(require.resolve('ali-oss'));

export interface RequestOptions {
  method: string;
  headers: Record<string, string>;
  content?: Buffer | string;
  stream?: Readable;
  customResponse?: boolean;
}

interface Reply {
  status: number;
  data: Buffer;
  headers: Record<string, string>;
  res: Readable & { headers: Record<string, string>; status: number };
}

export function reply(
  body: string | Uint8Array = '',
  status = 200,
  headers: Record<string, string> = {},
): Reply {
  const data = Buffer.from(body);
  const allHeaders = {
    'content-type': 'text/plain',
    'content-length': String(data.length),
    etag: '"test-etag"',
    'last-modified': 'Thu, 15 Oct 2026 10:00:00 GMT',
    ...headers,
  };
  return {
    status,
    data,
    headers: allHeaders,
    res: Object.assign(Readable.from([data]), { headers: allHeaders, status }),
  };
}

export function mockTransport(
  handler: (url: URL, options: RequestOptions) => Promise<Reply> | Reply = () =>
    reply(),
) {
  // Intercept only transport: the official SDK still builds, signs and parses requests.
  const urllib = sdkRequire('urllib') as {
    request(url: string, options: RequestOptions): Promise<Reply>;
  };
  return vi
    .spyOn(urllib, 'request')
    .mockImplementation(async (url, options) => handler(new URL(url), options));
}

export const config: OssDriveDiskConfig = {
  driver: 'oss',
  region: 'oss-cn-hangzhou',
  bucket: 'test-bucket',
  visibility: 'private',
  supportsACL: false,
  credentials: { accessKeyId: 'test-key', accessKeySecret: 'test-secret' },
};

export function disk(overrides: Partial<OssDriveDiskConfig> = {}) {
  return createDriveManager({
    default: 'oss',
    disks: { oss: { ...config, ...overrides } },
  }).use();
}

export function acl(value: string) {
  return reply(
    `<AccessControlPolicy><Owner><ID>owner</ID><DisplayName>Owner</DisplayName></Owner><AccessControlList><Grant>${value}</Grant></AccessControlList></AccessControlPolicy>`,
  );
}
