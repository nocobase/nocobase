/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import JSZip from 'jszip';

export async function createZipBase64(
  files: Record<string, string | Buffer>,
  options: { compressed?: boolean } = {},
): Promise<string> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generateAsync({
    type: 'base64',
    ...(options.compressed ? { compression: 'DEFLATE' as const, compressionOptions: { level: 9 } } : {}),
  });
}

export async function createSymlinkZipBase64(path: string, target: string): Promise<string> {
  const zip = new JSZip();
  zip.file(path, target, { unixPermissions: 0o120777 });
  return zip.generateAsync({ type: 'base64', platform: 'UNIX' });
}

export function createUnsignedSessionToken(sessionId: string): string {
  const encode = (value: Record<string, unknown>) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ jti: sessionId })}.signature`;
}
