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
import { createHash } from 'crypto';
import { vi } from 'vitest';

import type { LightExtensionEntryRecord } from '../../shared/types';
import { buildLightExtensionSettingsHashes } from '../services/LightExtensionEntryService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { SettingsResolverService } from '../services/SettingsResolverService';

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
    expect(result.settingsSchemaHash).toBeNull();
    expect(result.settingsDefaultsHash).toBeNull();
    expect(result.runtimeArtifact?.metadata).not.toHaveProperty('settingsSchema');
  });

  it('hashes and resolves explicit empty, array, and null defaults without treating them as absent', () => {
    const settingsSchema = {
      type: 'object',
      properties: {
        emptyObject: { type: 'object', default: {} },
        emptyArray: { type: 'array', default: [] },
        nullable: { type: 'string', default: null },
        absent: { type: 'string' },
      },
    };
    const hashes = buildLightExtensionSettingsHashes(settingsSchema);
    const withoutExplicitDefaults = buildLightExtensionSettingsHashes({
      type: 'object',
      properties: {
        emptyObject: { type: 'object' },
        emptyArray: { type: 'array' },
        nullable: { type: 'string' },
        absent: { type: 'string' },
      },
    });
    const expectedDefaultsHash = createHash('sha256')
      .update('{"emptyArray":[],"emptyObject":{},"nullable":null}')
      .digest('hex');

    expect(hashes.settingsDefaultsHash).toBe(expectedDefaultsHash);
    expect(hashes.settingsDefaultsHash).not.toBe(withoutExplicitDefaults.settingsDefaultsHash);
    expect(new SettingsResolverService().getRuntimeDefaults({ id: 'entry_1', settingsSchema })).toEqual({
      emptyObject: {},
      emptyArray: [],
      nullable: null,
    });
  });

  it('deeply merges object-level defaults with property defaults for runtime and hash parity', () => {
    const settingsSchema = {
      type: 'object',
      default: {
        displayOptions: {
          color: 'red',
        },
        explicitNull: null,
      },
      properties: {
        displayOptions: {
          type: 'object',
          default: {
            pageSize: 20,
          },
          properties: {
            density: { type: 'string', default: 'compact' },
            color: { type: 'string', default: 'blue' },
          },
        },
        emptyObject: { type: 'object', default: {} },
        explicitNull: { type: ['string', 'null'], default: 'fallback' },
      },
    };
    const defaults = {
      displayOptions: {
        density: 'compact',
        color: 'red',
        pageSize: 20,
      },
      emptyObject: {},
      explicitNull: null,
    };

    expect(new SettingsResolverService().getRuntimeDefaults({ id: 'entry_1', settingsSchema })).toEqual(defaults);
    expect(buildLightExtensionSettingsHashes(settingsSchema).settingsDefaultsHash).toBe(
      createHash('sha256')
        .update(
          '{"displayOptions":{"color":"red","density":"compact","pageSize":20},"emptyObject":{},"explicitNull":null}',
        )
        .digest('hex'),
    );
  });

  it('preserves explicit root null and array defaults in the defaults hash', () => {
    expect(buildLightExtensionSettingsHashes({ type: ['object', 'null'], default: null }).settingsDefaultsHash).toBe(
      createHash('sha256').update('null').digest('hex'),
    );
    expect(buildLightExtensionSettingsHashes({ type: 'array', default: [] }).settingsDefaultsHash).toBe(
      createHash('sha256').update('[]').digest('hex'),
    );
  });

  it('distinguishes missing settings schemas from explicit empty schemas', () => {
    expect(buildLightExtensionSettingsHashes(null)).toEqual({
      settingsSchemaHash: null,
      settingsDefaultsHash: null,
    });
    expect(buildLightExtensionSettingsHashes({})).toEqual({
      settingsSchemaHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
      settingsDefaultsHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
    });
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
    descriptorPath: 'src/client/js-blocks/example/entry.json',
    title: 'Example',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: null,
    settingsSchemaHash: null,
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
