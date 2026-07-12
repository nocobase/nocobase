/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';

import { RuntimeResolveService } from '../services/RuntimeResolveService';

describe('light extension runtime resolve pointer protocol', () => {
  it('returns the same immutable artifact pointer while settings remain request-specific', async () => {
    const service = createService();
    const sourceBinding = {
      type: 'light-extension-entry' as const,
      repoId: 'repo_1',
      entryId: 'entry_1',
      kind: 'js-action',
    };

    const first = await service.resolve({ sourceMode: 'light-extension', sourceBinding, settings: { label: 'A' } });
    const second = await service.resolve({ sourceMode: 'light-extension', sourceBinding, settings: { label: 'B' } });

    expect(first).toMatchObject({
      runtimeCodeHash: 'hash_v1',
      artifactHash: 'a'.repeat(64),
      settings: { label: 'A' },
    });
    expect(second).toMatchObject({
      runtimeCodeHash: 'hash_v1',
      artifactHash: 'a'.repeat(64),
      settings: { label: 'B' },
    });
    expect(second).not.toHaveProperty('code');
    expect(second).not.toHaveProperty('sourceMap');
  });

  it('never embeds code or source maps in resolve responses', async () => {
    const service = createService();
    const result = await service.resolve({
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: 'repo_1',
        entryId: 'entry_1',
        kind: 'js-action',
      },
    });

    expect(result).not.toHaveProperty('code');
    expect(result).not.toHaveProperty('sourceMap');
  });
});

function createService(): RuntimeResolveService {
  const entry = createModel({
    id: 'entry_1',
    repoId: 'repo_1',
    target: 'client',
    kind: 'js-action',
    entryName: 'example',
    entryPath: 'src/client/js-actions/example/index.ts',
    metaPath: null,
    settingsPath: null,
    title: 'Example',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: {
      type: 'object',
      properties: { label: { type: 'string', default: 'DEFAULT' } },
    },
    compiledCommitId: 'commit_1',
    runtimeArtifact: {
      code: 'ctx.message.success(ctx.settings.label);',
      sourceMap: '{"version":3}',
      version: 'v2',
      entryPath: 'src/client/js-actions/example/index.ts',
      metadata: {},
    },
    runtimeVersion: 'v2',
    surfaceStyle: 'action',
    runtimeCodeHash: 'hash_v1',
    artifactHash: 'a'.repeat(64),
    filesHash: 'files_v1',
    settingsDefaultsHash: 'settings_v1',
    compiledAt: '2026-07-12T00:00:00.000Z',
    healthStatus: 'ready',
    diagnostics: [],
  });
  const repo = createModel({ id: 'repo_1', lifecycleStatus: 'enabled', headCommitId: 'commit_1' });
  const db = {
    getRepository(name: string) {
      if (name === 'lightExtensionEntries') {
        return { findOne: async () => entry };
      }
      if (name === 'lightExtensionRepos') {
        return { findOne: async () => repo };
      }
      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;

  return new RuntimeResolveService(db);
}

function createModel(values: Record<string, unknown>): Model {
  return {
    get: (key: string) => values[key],
  } as unknown as Model;
}
