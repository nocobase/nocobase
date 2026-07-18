/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { HandlerType } from '@nocobase/resourcer';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';

import {
  createLightExtensionClientAppsResource,
  CLIENT_APP_UPLOAD_LIMITS,
  lightExtensionClientAppActionNames,
} from '../resources/lightExtensionClientApps';
import type { ClientAppService } from '../services/ClientAppService';

describe('lightExtensionClientApps resource', () => {
  it('exposes a dedicated multipart upload action and removes the request temporary file', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'client-app-resource-test-'));
    const zipPath = path.join(root, 'upload.zip');
    await fs.writeFile(zipPath, Buffer.from('zip'));
    const calls: unknown[] = [];
    const service = {
      upload: async (input: unknown, context: unknown) => {
        calls.push({ input, context });
        return { entryId: 'entry-1' };
      },
      listClientApps: async () => [],
      resolveClientApp: async () => ({ entryId: 'entry-1' }),
    } as unknown as ClientAppService;
    const resource = createLightExtensionClientAppsResource(service);

    expect(resource.name).toBe('lightExtensionClientApps');
    expect(resource.only).toEqual(lightExtensionClientAppActionNames);
    expect(resource.middleware).toEqual(expect.any(Function));
    await runAction(resource.actions?.upload as HandlerType, {
      action: { params: {} },
      auth: { user: { id: 7 } },
      can: async () => true,
      request: {
        headers: { 'x-request-id': 'request-1' },
        body: { repoId: 'repo-1' },
        file: { path: zipPath },
      },
    });

    expect(calls).toEqual([
      {
        input: { repoId: 'repo-1', zipPath },
        context: {
          actorUserId: '7',
          requestId: 'request-1',
          requestSource: undefined,
          can: expect.any(Function),
        },
      },
    ]);
    await expect(fs.stat(zipPath)).rejects.toMatchObject({ code: 'ENOENT' });
    await fs.rm(root, { recursive: true, force: true });
  });

  it('returns stable domain errors for missing upload files and routes list/get to the service', async () => {
    const calls: string[] = [];
    const service = {
      upload: async () => ({ entryId: 'entry-1' }),
      listClientApps: async (repoId: string) => {
        calls.push(`list:${repoId}`);
        return [];
      },
      resolveClientApp: async (entryId: string) => {
        calls.push(`get:${entryId}`);
        return { entryId };
      },
    } as unknown as ClientAppService;
    const resource = createLightExtensionClientAppsResource(service);

    const missing = await runAction(resource.actions?.upload as HandlerType, {
      action: { params: { values: { repoId: 'repo-1' } } },
      request: { body: { repoId: 'repo-1' } },
    });
    expect(missing.status).toBe(400);
    expect(missing.body).toEqual({
      errors: [
        expect.objectContaining({
          code: 'LIGHT_EXTENSION_INVALID_INPUT',
          message: 'A client app ZIP file is required',
        }),
      ],
    });

    await runAction(resource.actions?.list as HandlerType, {
      action: { params: { values: { repoId: 'repo-1' } } },
    });
    const get = await runAction(resource.actions?.get as HandlerType, {
      action: { params: { filterByTk: 'entry-1' } },
    });
    expect(calls).toEqual(['list:repo-1', 'get:entry-1']);
    expect(get.body).toEqual({ entryId: 'entry-1' });
  });

  it('bounds multipart fields and removes a staged temporary file when parsing aborts', async () => {
    const service = {
      upload: vi.fn(),
      listClientApps: vi.fn(),
      resolveClientApp: vi.fn(),
    } as unknown as ClientAppService;
    const resource = createLightExtensionClientAppsResource(service);
    const before = new Set(await listUploadTemporaryFiles());
    const boundary = 'nocobase-client-app-boundary';
    const body = createMultipartBody(boundary, [
      {
        headers: 'Content-Disposition: form-data; name="file"; filename="app.zip"\r\nContent-Type: application/zip',
        body: 'zip-bytes',
      },
      {
        headers: 'Content-Disposition: form-data; name="repoId"',
        body: 'r'.repeat(CLIENT_APP_UPLOAD_LIMITS.fieldSize + 1),
      },
    ]);
    const request = Readable.from(body) as Readable & {
      headers: Record<string, string>;
      method: string;
    };
    request.headers = {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'content-length': String(body.length),
    };
    request.method = 'POST';
    const ctx = {
      action: { actionName: 'upload', params: {} },
      req: request,
      res: {},
      request: {},
    } as unknown as Context & {
      body?: unknown;
      status?: number;
    };

    await (resource.middleware as HandlerType)(ctx, async () => {
      throw new Error('The action must not run after a multipart limit error');
    });

    expect(ctx.status).toBe(413);
    expect(ctx.body).toEqual({
      errors: [
        expect.objectContaining({
          code: 'LIGHT_EXTENSION_INVALID_INPUT',
          details: expect.objectContaining({ limitCode: 'LIMIT_FIELD_VALUE' }),
        }),
      ],
    });
    const after = await listUploadTemporaryFiles();
    expect(after.filter((file) => !before.has(file))).toEqual([]);
  });
});

async function runAction(handler: HandlerType, input: Record<string, unknown>) {
  const ctx = {
    ...input,
  } as unknown as Context & {
    body?: unknown;
    status?: number;
  };
  await handler(ctx, async () => undefined);
  return ctx;
}

function createMultipartBody(boundary: string, parts: Array<{ headers: string; body: string }>): Buffer {
  return Buffer.from(
    `${parts.map((part) => `--${boundary}\r\n${part.headers}\r\n\r\n${part.body}\r\n`).join('')}--${boundary}--\r\n`,
  );
}

async function listUploadTemporaryFiles(): Promise<string[]> {
  return (await fs.readdir(os.tmpdir())).filter((file) => file.startsWith('nocobase-client-app-upload-')).sort();
}
