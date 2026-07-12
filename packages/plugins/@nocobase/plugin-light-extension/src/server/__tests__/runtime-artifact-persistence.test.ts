/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import type { RunJSRuntimeArtifact } from '@nocobase/runjs';
import { vi } from 'vitest';

import type { LightExtensionEntryRecord } from '../../shared/types';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';

describe('light extension runtime artifact persistence', () => {
  it('upserts the immutable artifact before updating the Entry pointer in the same transaction', async () => {
    const calls: string[] = [];
    const transaction = {} as Transaction;
    const entryValues = createEntryValues();
    const entryModel = createModel(entryValues, async (values) => {
      calls.push('entry.update');
      Object.assign(entryValues, values);
    });
    const artifactRepository = {
      updateOrCreate: vi.fn(async (options) => {
        calls.push('artifact.upsert');
        expect(options.transaction).toBe(transaction);
      }),
    };
    const entryRepository = {
      findOne: vi.fn(async () => entryModel),
    };
    const db = {
      getRepository(name: string) {
        if (name === 'lightExtensionRuntimeArtifacts') {
          return artifactRepository;
        }
        if (name === 'lightExtensionEntries') {
          return entryRepository;
        }
        throw new Error(`Unexpected repository ${name}`);
      },
    } as unknown as Database;
    const service = new LightExtensionRuntimeCompileService(db, {} as never, {} as never, {} as never);
    const persist = service as unknown as {
      persistSuccessfulCompile(
        input: {
          entry: LightExtensionEntryRecord;
          commitId: string;
          artifact: RunJSRuntimeArtifact;
          surfaceStyle: string;
          diagnostics: [];
        },
        transaction: Transaction,
      ): Promise<LightExtensionEntryRecord>;
    };

    const result = await persist.persistSuccessfulCompile(
      {
        entry: entryValues as unknown as LightExtensionEntryRecord,
        commitId: 'commit_1',
        artifact: {
          code: "ctx.message.success('V1');",
          sourceMap: '{"version":3}',
          version: 'v2',
          entryPath: 'src/client/js-actions/example/index.ts',
          diagnostics: [],
          filesHash: 'files_hash',
        },
        surfaceStyle: 'action',
        diagnostics: [],
      },
      transaction,
    );

    expect(calls).toEqual(['artifact.upsert', 'entry.update']);
    expect(artifactRepository.updateOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        filterKeys: ['artifactHash'],
        values: expect.objectContaining({
          artifactHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
          runtimeCodeHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
          runtimeContract: 'light-extension.runtime-artifact.v1',
          code: expect.stringContaining('V1'),
        }),
      }),
    );
    expect(result.artifactHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(result.runtimeCodeHash).toMatch(/^[a-f0-9]{64}$/u);
  });
});

function createEntryValues(): Record<string, unknown> {
  return {
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
    settingsSchema: null,
    compiledCommitId: null,
    runtimeArtifact: null,
    runtimeVersion: null,
    surfaceStyle: null,
    runtimeCodeHash: null,
    artifactHash: null,
    filesHash: null,
    settingsDefaultsHash: null,
    compiledAt: null,
    healthStatus: 'ready',
    diagnostics: [],
  };
}

function createModel(
  values: Record<string, unknown>,
  update: (values: Record<string, unknown>) => Promise<void>,
): Model {
  return {
    get: (key: string) => values[key],
    update: async (nextValues: Record<string, unknown>) => {
      await update(nextValues);
      return createModel(values, update);
    },
  } as unknown as Model;
}
