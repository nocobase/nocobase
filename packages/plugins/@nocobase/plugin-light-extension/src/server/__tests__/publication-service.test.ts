/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import type { RunJSRuntimeArtifact } from '@nocobase/plugin-vsc-file';
import { vi } from 'vitest';

import { LightExtensionPublicationService, toPublicationMetadata } from '../services/LightExtensionPublicationService';

describe('plugin-light-extension publication service', () => {
  it('creates immutable external RunJS publication rows with settings snapshots and stable hashes', async () => {
    const { db, publicationsRepository } = createDbStub();
    const service = new LightExtensionPublicationService(db);
    const artifact = createArtifact();

    const publication = await service.createOrGetPublication(
      {
        repoId: 'ler_sales',
        entryId: 'lee_sales_kpi',
        commitId: 'vsc_commit_1',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        kind: 'js-block',
        surfaceStyle: 'render',
        artifact,
        settingsSchemaSnapshot: {
          type: 'object',
          properties: {
            threshold: {
              type: 'number',
              default: 5,
            },
            region: {
              type: 'string',
            },
          },
        },
        diagnostics: [
          {
            code: 'publish_warning',
            severity: 'warning',
            message: 'warning',
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
          },
        ],
      },
      {
        actorUserId: '1',
        requestSource: 'unit-test',
      },
    );

    const createValues = publicationsRepository.create.mock.calls[0][0].values as Record<string, unknown>;
    expect(publication).toMatchObject({
      id: 'lep_created',
      repoId: 'ler_sales',
      entryId: 'lee_sales_kpi',
      commitId: 'vsc_commit_1',
      filesHash: 'files_hash_1',
      kind: 'js-block',
      surfaceStyle: 'render',
      runtimeVersion: 'v2',
      createdById: '1',
      createdFromRequestSource: 'unit-test',
    });
    expect(createValues).toMatchObject({
      settingsDefaultsSnapshot: {
        threshold: 5,
      },
      filesHash: 'files_hash_1',
      createdById: '1',
      createdFromRequestSource: 'unit-test',
    });
    expect(createValues.settingsSchemaHash).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(createValues.settingsDefaultsHash).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(createValues.runtimeCodeHash).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));
    expect((createValues.artifact as { code?: string }).code).toContain('secret runtime code');
    expect((createValues.artifact as { metadata?: Record<string, unknown> }).metadata).toMatchObject({
      runtimeCodeHash: createValues.runtimeCodeHash,
      publicationContract: 'light-extension.external-runjs.v1',
    });

    const metadata = toPublicationMetadata(publication);
    expect(JSON.stringify(metadata.artifact)).not.toContain('secret runtime code');
    expect(JSON.stringify(metadata.artifact)).not.toContain('sourceMap');
    expect(metadata.settingsSchemaSnapshot).toMatchObject({
      properties: {
        threshold: {
          default: 5,
        },
      },
    });
  });

  it('returns an existing publication for the idempotency key instead of creating a duplicate', async () => {
    const existing = createPublicationRecord({
      id: 'lep_existing',
      entryId: 'lee_sales_kpi',
      settingsDefaultsHash: 'defaults_hash_existing',
    });
    const { db, publicationsRepository } = createDbStub(existing);
    const service = new LightExtensionPublicationService(db);

    const publication = await service.createOrGetPublication({
      repoId: 'ler_sales',
      entryId: 'lee_sales_kpi',
      commitId: 'vsc_commit_1',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
      surfaceStyle: 'render',
      artifact: createArtifact(),
      settingsDefaultsSnapshot: {
        threshold: 5,
      },
    });

    expect(publication.id).toBe('lep_existing');
    expect(publicationsRepository.create).not.toHaveBeenCalled();
    expect(publicationsRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          entryId: 'lee_sales_kpi',
          commitId: 'vsc_commit_1',
          filesHash: 'files_hash_1',
          runtimeCodeHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          settingsDefaultsHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
    );
  });
});

function createDbStub(existing?: Record<string, unknown>) {
  const publicationsRepository = {
    findOne: vi.fn().mockResolvedValue(existing ? createModel(existing) : null),
    create: vi.fn().mockImplementation((input: { values: Record<string, unknown> }) =>
      Promise.resolve(
        createModel({
          ...input.values,
          id: 'lep_created',
        }),
      ),
    ),
  };
  const db = {
    getRepository: (name: string) => {
      if (name === 'lightExtensionEntryPublications') {
        return publicationsRepository;
      }

      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;

  return {
    db,
    publicationsRepository,
  };
}

function createArtifact(): RunJSRuntimeArtifact {
  return {
    code: "const secret = 'secret runtime code';\nctx.render(secret);\n",
    sourceMap: '{"version":3}',
    version: 'v2',
    entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    filesHash: 'files_hash_1',
    diagnostics: [],
    metadata: {
      repoId: 'ler_sales',
      entryId: 'lee_sales_kpi',
      kind: 'js-block',
    },
  };
}

function createPublicationRecord(input: {
  id: string;
  entryId: string;
  settingsDefaultsHash: string;
}): Record<string, unknown> {
  return {
    id: input.id,
    repoId: 'ler_sales',
    entryId: input.entryId,
    commitId: 'vsc_commit_1',
    entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    target: 'client',
    kind: 'js-block',
    surfaceStyle: 'render',
    runtimeVersion: 'v2',
    artifact: createArtifact(),
    settingsSchemaSnapshot: {
      type: 'object',
    },
    settingsDefaultsSnapshot: {
      threshold: 5,
    },
    settingsSchemaHash: 'schema_hash_existing',
    settingsDefaultsHash: input.settingsDefaultsHash,
    filesHash: 'files_hash_1',
    runtimeCodeHash: 'runtime_hash_existing',
    diagnostics: [],
    createdById: '1',
    createdFromRequestSource: 'unit-test',
    createdAt: new Date('2026-07-06T00:00:00.000Z'),
  };
}

function createModel(values: Record<string, unknown>): Model {
  return {
    get: (key: string) => values[key],
  } as unknown as Model;
}
