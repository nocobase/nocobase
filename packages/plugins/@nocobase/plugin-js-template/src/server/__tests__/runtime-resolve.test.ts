/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { vi } from 'vitest';

import type { JsTemplateRuntimeSourceBinding } from '../../shared/types';
import { JsTemplateRuntimeService } from '../services/JsTemplateRuntimeService';

describe('JsTemplateRuntimeService', () => {
  it('returns an immutable artifact pointer and merged settings without runtime code', async () => {
    const { service, templatesRepository } = createJsTemplateRuntimeService();

    const result = await service.resolve(
      {
        sourceMode: 'js-template',
        sourceBinding: createSourceBinding(),
        settings: {
          region: 'EMEA',
          nested: {
            label: 'Revenue',
          },
        },
      },
      {
        requestId: 'req_runtime_resolve',
        actorUserId: '7',
      },
    );

    expect(templatesRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByTk: 'jtt_sales_kpi',
      }),
    );
    expect(result).toMatchObject({
      templateId: 'jtt_sales_kpi',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      artifactHash: 'a'.repeat(64),
      artifactUrl: `/api/jsTemplateRuntime:getArtifact/${'a'.repeat(64)}`,
      runtimeCodeHash: 'runtime_hash_1',
      runtimeVersion: 'v2',
      settings: {
        threshold: 5,
        region: 'EMEA',
        nested: {
          enabled: true,
          label: 'Revenue',
        },
      },
      settingsHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(result).not.toHaveProperty('code');
    expect(result).not.toHaveProperty('sourceMap');
  });

  it('shares immutable artifact pointers while keeping settings request-specific', async () => {
    const { service } = createJsTemplateRuntimeService({
      settingsSchema: {
        type: 'object',
        properties: { label: { type: 'string', default: 'DEFAULT' } },
      },
    });
    const sourceBinding = createSourceBinding();

    const first = await service.resolve({ sourceMode: 'js-template', sourceBinding, settings: { label: 'A' } });
    const second = await service.resolve({ sourceMode: 'js-template', sourceBinding, settings: { label: 'B' } });

    expect(first).toMatchObject({ artifactHash: 'a'.repeat(64), settings: { label: 'A' } });
    expect(second).toMatchObject({ artifactHash: 'a'.repeat(64), settings: { label: 'B' } });
    expect(second).not.toHaveProperty('code');
    expect(second).not.toHaveProperty('sourceMap');
  });

  it('filters selectable templates whose runtime was compiled from a non-head commit', async () => {
    const { service } = createJsTemplateRuntimeService({
      projectHeadCommitId: 'vsc_commit_2',
    });

    await expect(service.listSelectableTemplates()).resolves.toEqual([]);
  });

  it.each([
    {
      name: 'returns the schema hash independently from the defaults hash',
      options: { category: 'examples' },
      expected: {
        category: 'examples',
        settingsSchemaHash: 'schema_hash_1',
        settingsDefaultsHash: 'defaults_hash_1',
      },
    },
    {
      name: 'keeps no-schema templates selectable when both settings hashes are null',
      options: { settingsSchema: null, settingsSchemaHash: null, settingsDefaultsHash: null },
      expected: {
        settingsSchema: null,
        settingsSchemaHash: null,
        settingsDefaultsHash: null,
        runtimeAvailable: true,
      },
    },
  ])('$name', async ({ options, expected }) => {
    const { service, templatesRepository } = createJsTemplateRuntimeService(options);

    await expect(service.listSelectableTemplates()).resolves.toEqual([expect.objectContaining(expected)]);
    expect(templatesRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ fields: expect.arrayContaining(['category']) }),
    );
  });

  it('parses {{$user.nickname}} ACL row filters with a projected user lookup', async () => {
    const { service, projectsRepository, usersRepository } = createJsTemplateRuntimeService();
    projectsRepository.find
      .mockResolvedValueOnce([
        createModel({ id: 'jtp_sales', lifecycleStatus: 'enabled', headCommitId: 'vsc_commit_1' }),
      ])
      .mockResolvedValueOnce([createModel({ id: 'jtp_sales', name: 'visible' })]);
    usersRepository.findOne.mockResolvedValue({ nickname: 'visible' });

    await expect(
      service.listSelectableTemplates(
        {},
        {
          can: async () => ({
            params: {
              fields: ['id', 'name'],
              filter: { name: '{{$user.nickname}}' },
            },
          }),
          currentUser: { id: 7 },
        },
      ),
    ).resolves.toEqual([expect.objectContaining({ projectId: 'jtp_sales', projectName: 'visible' })]);
    expect(projectsRepository.find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        fields: ['id', 'name'],
        filter: {
          $and: [expect.anything(), { name: 'visible' }],
        },
      }),
    );
    expect(usersRepository.findOne).toHaveBeenCalledWith({ filterByTk: 7, fields: ['nickname'] });
  });

  it('projects only ACL-visible project labels and merges the parsed row filter with catalog project ids', async () => {
    const { service, projectsRepository } = createJsTemplateRuntimeService();
    projectsRepository.find
      .mockResolvedValueOnce([
        createModel({ id: 'jtp_sales', lifecycleStatus: 'enabled', headCommitId: 'vsc_commit_1' }),
      ])
      .mockResolvedValueOnce([createModel({ id: 'jtp_sales', title: 'Sales title' })]);

    await expect(
      service.listSelectableTemplates(
        {},
        {
          can: async () => ({
            params: {
              fields: ['id', 'title'],
              filter: { id: '{{ctx.state.visibleProjectId}}' },
            },
          }),
          state: { visibleProjectId: 'jtp_sales' },
        },
      ),
    ).resolves.toEqual([expect.objectContaining({ projectId: 'jtp_sales', projectTitle: 'Sales title' })]);
    expect(projectsRepository.find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        fields: ['id', 'title'],
        filter: {
          $and: [{ id: { $in: ['jtp_sales'] } }, { id: 'jtp_sales' }],
        },
      }),
    );
  });

  it('rejects runtime bindings whose identity does not match the current template runtime', async () => {
    const { service } = createJsTemplateRuntimeService();

    await expect(
      service.resolve(
        {
          sourceMode: 'js-template',
          sourceBinding: createSourceBinding({ kind: 'js-field' }),
          settings: {},
        },
        {},
      ),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_BINDING_OUTDATED',
      status: 409,
      details: {
        templateId: 'jtt_sales_kpi',
        mismatches: [
          {
            field: 'kind',
            expected: 'js-field',
            actual: 'js-block',
          },
        ],
      },
    });
  });

  it('blocks runtime code for unavailable projects, unhealthy templates, unsupported kinds, and missing artifacts', async () => {
    const blockedCases = [
      {
        name: 'missing project',
        projectExists: false,
        errorCode: 'JS_TEMPLATE_PROJECT_NOT_FOUND',
        status: 404,
        reasonCode: 'project_missing',
      },
      {
        name: 'disabled project',
        projectLifecycleStatus: 'disabled',
        reasonCode: 'project_disabled',
      },
      {
        name: 'missing template',
        templateHealthStatus: 'missing',
        reasonCode: 'template_missing',
      },
      {
        name: 'unsupported persisted kind',
        templateKind: 'unsupported-kind',
        reasonCode: 'kind_unsupported',
      },
      {
        name: 'missing runtime',
        runtimeArtifact: null,
        compiledCommitId: null,
        reasonCode: 'runtime_missing',
      },
      {
        name: 'runtime compiled from a non-head commit',
        projectHeadCommitId: 'vsc_commit_2',
        reasonCode: 'runtime_missing',
      },
    ];

    for (const blockedCase of blockedCases) {
      const { service } = createJsTemplateRuntimeService(blockedCase);

      const resolution = service.resolve(
        {
          sourceMode: 'js-template',
          sourceBinding: createSourceBinding({
            kind: blockedCase.sourceKind || 'js-block',
          }),
          settings: {},
        },
        {},
      );
      if (blockedCase.templateKind === 'unsupported-kind') {
        await expect(resolution).rejects.toThrow('Unsupported JS Template kind: unsupported-kind');
        continue;
      }

      await expect(resolution).rejects.toMatchObject({
        code: blockedCase.errorCode || 'JS_TEMPLATE_RUNTIME_UNAVAILABLE',
        status: blockedCase.status || 409,
        details: {
          reasonCode: blockedCase.reasonCode,
          templateId: 'jtt_sales_kpi',
        },
      });
    }
  });

  it('uses 422 for runtime resolve input contract failures before loading templates', async () => {
    const { service, templatesRepository } = createJsTemplateRuntimeService();

    await expect(
      service.resolve(
        {
          sourceMode: 'inline',
          sourceBinding: createSourceBinding(),
          settings: {},
        } as never,
        {},
      ),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_INVALID_INPUT',
      status: 422,
      details: {
        reasonCode: 'invalid_input',
      },
    });
    expect(templatesRepository.findOne).not.toHaveBeenCalled();

    await expect(
      service.resolve(
        {
          sourceMode: 'js-template',
          sourceBinding: {
            ...createSourceBinding(),
            templateTitle: 'display-only metadata',
          },
          settings: {},
        } as never,
        {},
      ),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_INVALID_INPUT',
      status: 422,
      details: {
        reasonCode: 'invalid_input',
      },
    });
    expect(templatesRepository.findOne).not.toHaveBeenCalled();
  });
});

function createJsTemplateRuntimeService(
  options: {
    projectExists?: boolean;
    projectLifecycleStatus?: string;
    templateHealthStatus?: string;
    templateKind?: string;
    sourceKind?: string;
    runtimeArtifact?: Record<string, unknown> | null;
    compiledCommitId?: string | null;
    projectHeadCommitId?: string | null;
    entryPath?: string;
    artifactEntryPath?: string;
    settingsSchema?: Record<string, unknown> | null;
    settingsSchemaHash?: string | null;
    settingsDefaultsHash?: string | null;
    category?: string | null;
  } = {},
) {
  const templateRecord = createTemplateRecord(options);
  const projectRecord =
    options.projectExists === false
      ? null
      : createModel({
          id: 'jtp_sales',
          lifecycleStatus: options.projectLifecycleStatus || 'enabled',
          headCommitId:
            typeof options.projectHeadCommitId === 'undefined' ? 'vsc_commit_1' : options.projectHeadCommitId,
        });
  const projectsRepository = {
    find: vi.fn().mockResolvedValue(projectRecord ? [projectRecord] : []),
    findOne: vi.fn().mockResolvedValue(projectRecord),
  };
  const templatesRepository = {
    find: vi.fn().mockResolvedValue([createModel(templateRecord)]),
    findOne: vi.fn().mockResolvedValue(createModel(templateRecord)),
  };
  const usersRepository = {
    findOne: vi.fn(),
  };
  const db = {
    getCollection: vi.fn(() => ({})),
    getFieldByPath: vi.fn((path: string) => (path === 'users.nickname' ? {} : undefined)),
    getRepository: (name: string) => {
      if (name === 'jsTemplateProjects') {
        return projectsRepository;
      }
      if (name === 'jsTemplates') {
        return templatesRepository;
      }
      if (name === 'users') {
        return usersRepository;
      }
      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;
  return {
    service: new JsTemplateRuntimeService(db),
    projectsRepository,
    templatesRepository,
    usersRepository,
  };
}

function createSourceBinding(input: Partial<JsTemplateRuntimeSourceBinding> = {}): JsTemplateRuntimeSourceBinding {
  return {
    type: 'js-template-entry',
    projectId: 'jtp_sales',
    templateId: 'jtt_sales_kpi',
    kind: 'js-block',
    ...input,
  };
}

function createTemplateRecord(
  input: {
    templateHealthStatus?: string;
    templateKind?: string;
    runtimeArtifact?: Record<string, unknown> | null;
    compiledCommitId?: string | null;
    entryPath?: string;
    artifactEntryPath?: string;
    settingsSchema?: Record<string, unknown> | null;
    settingsSchemaHash?: string | null;
    settingsDefaultsHash?: string | null;
  } = {},
): Record<string, unknown> {
  const kind = input.templateKind || 'js-block';
  const entryPath = input.entryPath || 'src/client/js-blocks/sales-kpi/index.tsx';
  const artifactEntryPath = input.artifactEntryPath || entryPath;
  const runtimeArtifact =
    typeof input.runtimeArtifact === 'undefined'
      ? {
          code: "const secret = 'runtime secret';\nctx.render(secret);\n",
          sourceMap: '{"version":3}',
          version: 'v2',
          entryPath: artifactEntryPath,
          filesHash: 'files_hash_1',
          diagnostics: [],
          metadata: {
            runtimeContract: 'js-template.current-runtime.v1',
          },
        }
      : input.runtimeArtifact;

  return {
    id: 'jtt_sales_kpi',
    projectId: 'jtp_sales',
    target: 'client',
    kind,
    templateName: 'sales-kpi',
    entryPath,
    descriptorPath: 'src/client/js-blocks/sales-kpi/entry.json',
    title: 'Sales KPI',
    description: null,
    category: typeof input.category === 'undefined' ? null : input.category,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema:
      typeof input.settingsSchema === 'undefined'
        ? {
            type: 'object',
            required: ['threshold'],
            properties: {
              threshold: {
                type: 'number',
                default: 5,
                minimum: 0,
                maximum: 10,
              },
              region: {
                type: 'string',
                default: 'APAC',
                enum: ['APAC', 'EMEA'],
              },
              contactEmail: {
                type: 'string',
                default: 'ops@example.com',
                format: 'email',
              },
              nested: {
                type: 'object',
                properties: {
                  enabled: {
                    type: 'boolean',
                    default: true,
                  },
                  label: {
                    type: 'string',
                    default: 'KPI',
                  },
                },
              },
            },
          }
        : input.settingsSchema,
    settingsSchemaHash: typeof input.settingsSchemaHash === 'undefined' ? 'schema_hash_1' : input.settingsSchemaHash,
    compiledCommitId: typeof input.compiledCommitId === 'undefined' ? 'vsc_commit_1' : input.compiledCommitId,
    runtimeArtifact,
    runtimeVersion: runtimeArtifact ? 'v2' : null,
    surfaceStyle: runtimeArtifact ? 'render' : null,
    runtimeCodeHash: runtimeArtifact ? 'runtime_hash_1' : null,
    artifactHash: runtimeArtifact ? 'a'.repeat(64) : null,
    filesHash: runtimeArtifact ? 'files_hash_1' : null,
    settingsDefaultsHash: runtimeArtifact
      ? typeof input.settingsDefaultsHash === 'undefined'
        ? 'defaults_hash_1'
        : input.settingsDefaultsHash
      : null,
    compiledAt: runtimeArtifact ? '2026-07-06T00:00:00.000Z' : null,
    healthStatus: input.templateHealthStatus || 'ready',
    diagnostics: [],
    createdAt: null,
    updatedAt: null,
  };
}

function createModel(values: Record<string, unknown>): Model {
  return {
    get: (key: string) => values[key],
    update: vi.fn(async (nextValues: Record<string, unknown>) => {
      Object.assign(values, nextValues);
      return createModel(values);
    }),
  } as unknown as Model;
}
