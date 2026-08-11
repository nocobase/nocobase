/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PortalRuntimeRegistry } from '../portal-host/portal-registry';
import { writePortalSystemLog } from '../portal-host/portal-system-log';
import type { PortalActivationBackend } from '../portal-host/portal-types';

const tempRoots: string[] = [];

const getDateStamp = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

const readJsonLines = (file: string) =>
  fs
    .readFileSync(file, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);

describe('portal-host system log', () => {
  it('writes embedded portal initialization failures to the portal system log', async () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-host-log-'));
    tempRoots.push(rootDir);

    const createError = new Error('boom from embedded createPortal');
    const registry = new PortalRuntimeRegistry({
      backend: {
        kind: 'in-process',
        activate: async () => {
          throw createError;
        },
      } as PortalActivationBackend,
      resolveFactory: () => () => ({
        fetch: () => new Response(null),
      }),
      startEvictionLoop: false,
    });

    await registry.register('main:main', {
      appName: 'main',
      portalName: 'main',
      basePath: '/portals/main',
      rootDir,
    });
    registry.events.on('portal:createFailed', (event) => {
      const definition = registry.definition(event.portalId);
      expect(definition?.rootDir).toBe(rootDir);

      writePortalSystemLog({
        level: 'error',
        msg: 'Embedded Portal failed to initialize',
        definition,
        error: event.error,
        fields: {
          event: 'portal:createFailed',
          version: event.version,
          state: event.state,
          basePath: event.basePath,
        },
      });
    });

    try {
      await expect(registry.ensureActive('main:main')).rejects.toThrow('Portal "main:main" failed to initialize');
    } finally {
      await registry.destroyAll('test cleanup');
    }

    const systemFile = path.join(rootDir, 'logs', 'embedded', `system-${getDateStamp()}.log`);
    const logs = readJsonLines(systemFile);

    expect(logs.at(-1)).toMatchObject({
      channel: 'system',
      mode: 'embedded',
      appName: 'main',
      portalName: 'main',
      portalId: 'main:main',
      basePath: '/portals/main',
      event: 'portal:createFailed',
      msg: 'Embedded Portal failed to initialize',
      err: {
        message: 'boom from embedded createPortal',
      },
    });
  });
});
