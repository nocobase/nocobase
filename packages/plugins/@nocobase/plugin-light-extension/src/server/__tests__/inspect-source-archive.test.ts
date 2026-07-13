/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database } from '@nocobase/database';
import JSZip from 'jszip';
import { vi } from 'vitest';

import { LightExtensionError } from '../../shared/errors';
import { createLightExtensionReposResource } from '../resources/lightExtensionRepos';
import type { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import type { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('lightExtensionRepos:inspectSourceArchive', () => {
  it('parses the ZIP without invoking persistence or compilation services', async () => {
    const getRepo = vi.fn(async () => ({
      id: 'ler_inspect',
      lifecycleStatus: 'enabled',
    }));
    const getValidator = vi.fn(() => new LightExtensionValidator());
    const repoService = {
      getRepo,
      getValidator,
    } as unknown as LightExtensionRepoService;
    const runtimeCompileService = {
      compileCurrentRuntime: vi.fn(),
    } as unknown as LightExtensionRuntimeCompileService;
    const resource = createLightExtensionReposResource({} as Database, repoService, runtimeCompileService);
    const zip = new JSZip();
    zip.file('workspace/README.md', '# Inspected\n');
    zip.file('workspace/src/shared/value.ts', 'export const value = 1;\n');
    const ctx = createActionContext({
      repoId: 'ler_inspect',
      zipBase64: await zip.generateAsync({ type: 'base64' }),
    });
    const next = vi.fn(async () => {});

    await resource.actions?.inspectSourceArchive?.(ctx, next);

    expect((ctx as { body?: unknown }).body).toEqual({
      files: [
        expect.objectContaining({
          path: 'README.md',
          content: '# Inspected\n',
          language: 'markdown',
        }),
        expect.objectContaining({
          path: 'src/shared/value.ts',
          content: 'export const value = 1;\n',
          language: 'typescript',
        }),
      ],
    });
    expect(getRepo).toHaveBeenCalledWith('ler_inspect', expect.objectContaining({ actorUserId: null }));
    expect(getValidator).toHaveBeenCalledTimes(1);
    expect(runtimeCompileService.compileCurrentRuntime).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('requires an existing repository before parsing the ZIP', async () => {
    const getValidator = vi.fn(() => new LightExtensionValidator());
    const repoService = {
      getRepo: vi.fn(async () => {
        throw new LightExtensionError('LIGHT_EXTENSION_REPO_NOT_FOUND', 'Repository was not found');
      }),
      getValidator,
    } as unknown as LightExtensionRepoService;
    const resource = createLightExtensionReposResource(
      {} as Database,
      repoService,
      {} as LightExtensionRuntimeCompileService,
    );
    const ctx = createActionContext({
      repoId: 'ler_missing',
      zipBase64: 'not-base64',
    });

    await resource.actions?.inspectSourceArchive?.(
      ctx,
      vi.fn(async () => {}),
    );

    expect((ctx as { status?: number }).status).toBe(404);
    expect((ctx as { body?: unknown }).body).toMatchObject({
      errors: [expect.objectContaining({ code: 'LIGHT_EXTENSION_REPO_NOT_FOUND' })],
    });
    expect(getValidator).not.toHaveBeenCalled();
  });

  it('rejects archived repositories before parsing the ZIP', async () => {
    const getValidator = vi.fn(() => new LightExtensionValidator());
    const repoService = {
      getRepo: vi.fn(async () => ({
        id: 'ler_archived',
        lifecycleStatus: 'archived',
      })),
      getValidator,
    } as unknown as LightExtensionRepoService;
    const resource = createLightExtensionReposResource(
      {} as Database,
      repoService,
      {} as LightExtensionRuntimeCompileService,
    );
    const ctx = createActionContext({
      repoId: 'ler_archived',
      zipBase64: 'not-base64',
    });

    await resource.actions?.inspectSourceArchive?.(
      ctx,
      vi.fn(async () => {}),
    );

    expect((ctx as { status?: number }).status).toBe(409);
    expect((ctx as { body?: unknown }).body).toMatchObject({
      errors: [
        expect.objectContaining({
          code: 'LIGHT_EXTENSION_REPO_ARCHIVED',
          details: {
            repoId: 'ler_archived',
            lifecycleStatus: 'archived',
          },
        }),
      ],
    });
    expect(getValidator).not.toHaveBeenCalled();
  });
});

function createActionContext(values: Record<string, unknown>): Context {
  return {
    action: {
      params: { values },
    },
    request: {
      headers: {},
    },
  } as unknown as Context;
}
