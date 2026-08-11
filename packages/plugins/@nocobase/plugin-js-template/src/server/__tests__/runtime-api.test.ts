/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database, Model } from '@nocobase/database';
import { vi } from 'vitest';

import type { JsTemplateRuntimeSourceBinding } from '../../shared/types';
import { createJsTemplateRuntimeResource } from '../resources/jsTemplateRuntime';
import type { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import { JsTemplateRuntimeService } from '../services/JsTemplateRuntimeService';

const artifactHash = 'a'.repeat(64);

describe('JS Template runtime artifact API', () => {
  it('reads immutable artifacts by hash and rejects missing hashes with 404', async () => {
    const artifactRepository = { findOne: vi.fn().mockResolvedValue(createModel(createArtifact())) };
    const { service } = createService(artifactRepository, [{ projectId: 'jtp_main' }]);

    await expect(service.getArtifact(artifactHash)).resolves.toMatchObject({
      artifactHash,
      code: expect.stringContaining('ACTION_V1'),
    });
    await expect(service.getArtifact('b'.repeat(64))).rejects.toMatchObject({
      code: 'JS_TEMPLATE_ARTIFACT_NOT_FOUND',
      status: 404,
    });
    expect(artifactRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('requires a current-application Template reference and allows shared hashes', async () => {
    const artifactRepository = { findOne: vi.fn().mockResolvedValue(createModel(createArtifact())) };
    const foreignOnly = createService(artifactRepository, [{ projectId: 'jtp_foreign' }]);

    await expect(foreignOnly.service.getArtifact(artifactHash)).rejects.toMatchObject({
      code: 'JS_TEMPLATE_ARTIFACT_NOT_FOUND',
      status: 404,
    });
    expect(artifactRepository.findOne).not.toHaveBeenCalled();
    expect(foreignOnly.templatesRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          artifactHash,
          projectId: { $in: ['jtp_main'] },
        },
      }),
    );

    const shared = createService(artifactRepository, [{ projectId: 'jtp_foreign' }, { projectId: 'jtp_main' }]);
    await expect(shared.service.getArtifact(artifactHash)).resolves.toMatchObject({ artifactHash });
    expect(shared.templatesRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          artifactHash,
          projectId: { $in: ['jtp_main'] },
        },
      }),
    );
  });

  it('sets immutable cache headers and a strong ETag', async () => {
    const service = {
      getArtifact: vi.fn().mockResolvedValue(createArtifact()),
    } as unknown as JsTemplateRuntimeService;
    const resource = createJsTemplateRuntimeResource(service);
    const headers: Record<string, string> = {};
    const ctx = {
      action: { params: { values: { artifactHash } } },
      status: 200,
      set(nameOrHeaders: string | Record<string, string>, value?: string) {
        if (typeof nameOrHeaders === 'string') {
          headers[nameOrHeaders] = value || '';
        } else {
          Object.assign(headers, nameOrHeaders);
        }
      },
    } as unknown as Context;

    await resource.actions?.getArtifact?.(ctx, async () => undefined);

    expect((ctx as Context & { body?: unknown }).body).toMatchObject({ artifactHash });
    expect(headers).toEqual({
      ETag: `"${artifactHash}"`,
      'Cache-Control': 'private, max-age=31536000, immutable',
    });
    expect((ctx as Context & { withoutDataWrapping?: boolean }).withoutDataWrapping).toBe(true);
  });
});

function createService(
  artifactRepository: { findOne: ReturnType<typeof vi.fn> },
  references: Array<{ projectId: string }>,
): {
  service: JsTemplateRuntimeService;
  templatesRepository: { find: ReturnType<typeof vi.fn> };
  projectsRepository: { find: ReturnType<typeof vi.fn> };
} {
  const templatesRepository = {
    find: vi.fn(async (options: { filter?: { artifactHash?: string; projectId?: { $in?: string[] } } } = {}) =>
      options.filter?.artifactHash === artifactHash
        ? references
            .filter((reference) => options.filter?.projectId?.$in?.includes(reference.projectId))
            .map((reference) => createModel(reference))
        : [],
    ),
  };
  const projectsRepository = {
    find: vi.fn().mockResolvedValue([createModel({ id: 'jtp_main' })]),
  };
  const db = {
    getRepository(name: string) {
      if (name === 'jsTemplateArtifacts') {
        return artifactRepository;
      }
      if (name === 'jsTemplates') {
        return templatesRepository;
      }
      if (name === 'jsTemplateProjects') {
        return projectsRepository;
      }
      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;
  const projectService = {
    getCurrentApplicationName: () => 'main',
  } as unknown as JsTemplateProjectService;
  return {
    service: new JsTemplateRuntimeService(db, projectService),
    templatesRepository,
    projectsRepository,
  };
}

function createArtifact(): Record<string, unknown> {
  return {
    artifactHash,
    runtimeCodeHash: 'runtime_hash_v1',
    code: "ctx.message.success('ACTION_V1');",
    sourceMap: '{"version":3}',
    version: 'v2',
    entryPath: 'src/client/js-actions/example/index.ts',
    runtimeContract: 'js-template.runtime-artifact.v1',
    byteSize: 64,
  };
}

function createModel(values: Record<string, unknown>): Model {
  return { get: (key: string) => values[key] } as unknown as Model;
}
describe('plugin-js-template runtime resolve API', () => {
  it('normalizes resource input and passes request context to the service', async () => {
    const resolve = vi.fn().mockResolvedValue({ templateId: 'jtt_1', artifactHash: 'a'.repeat(64) });
    const resource = createJsTemplateRuntimeResource({ resolve } as unknown as JsTemplateRuntimeService);
    const sourceBinding = createSourceBinding();
    const ctx = {
      action: {
        params: {
          values: {
            sourceMode: 'js-template',
            sourceBinding,
            settings: { region: 'APAC' },
          },
        },
      },
      auth: { user: { id: 9 } },
      request: {
        headers: {
          'x-request-id': 'req_resource_runtime',
          'x-request-source': 'unit-resource',
        },
      },
    } as unknown as Context;

    await resource.actions?.resolve?.(ctx, async () => {});

    expect(resolve).toHaveBeenCalledWith(
      {
        sourceMode: 'js-template',
        sourceBinding,
        settings: { region: 'APAC' },
      },
      expect.objectContaining({
        actorUserId: '9',
        requestId: 'req_resource_runtime',
        requestSource: 'unit-resource',
      }),
    );
    expect((ctx as { body?: unknown }).body).toMatchObject({ templateId: 'jtt_1', artifactHash: 'a'.repeat(64) });
  });
});

function createSourceBinding(): JsTemplateRuntimeSourceBinding {
  return {
    type: 'js-template-entry',
    projectId: 'jtp_1',
    templateId: 'jtt_1',
    kind: 'js-block',
  };
}
