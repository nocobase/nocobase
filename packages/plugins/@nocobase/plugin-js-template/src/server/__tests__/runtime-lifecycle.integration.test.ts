/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type MockServer, createMockServer } from '@nocobase/test';

import { createJsTemplateEntryStarter } from '../../shared/jsTemplateEntryStarter';
import PluginJsTemplateServer from '../plugin';

const IMMUTABLE_CACHE_CONTROL = 'private, max-age=31536000, immutable';

interface RuntimeTemplateFixture {
  artifactHash: string;
  artifactUrl: string;
  projectId: string;
  templateId: string;
}

describe('JS Template runtime Artifact lifecycle', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: [PluginJsTemplateServer] });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('resolves an enabled Template and serves its immutable Artifact through the resource route', async () => {
    const fixture = await createRuntimeTemplate(app, {
      projectName: 'artifact-enabled-source',
      templateName: 'enabled-card',
      title: 'Enabled card',
    });

    expect(fixture.artifactUrl).toBe(`/api/jsTemplateRuntime:getArtifact/${fixture.artifactHash}`);
    const artifactResponse = await getRuntimeArtifact(app, fixture.artifactHash);

    expect(artifactResponse.status).toBe(200);
    expect(artifactResponse.body).toMatchObject({
      artifactHash: fixture.artifactHash,
      entryPath: 'src/client/js-blocks/enabled-card/index.tsx',
      runtimeVersion: 'v2',
    });
    expect(artifactResponse.headers['cache-control']).toBe(IMMUTABLE_CACHE_CONTROL);
    expect(artifactResponse.headers.etag).toBe(`"${fixture.artifactHash}"`);
  });

  it.each([
    { lifecycleStatus: 'disabled' as const, reasonCode: 'project_disabled' },
    { lifecycleStatus: 'archived' as const, reasonCode: 'project_archived' },
  ])(
    'blocks a new resolve for a $lifecycleStatus project while keeping its known Artifact fetchable',
    async ({ lifecycleStatus, reasonCode }) => {
      const fixture = await createRuntimeTemplate(app, {
        projectName: `artifact-${lifecycleStatus}-source`,
        templateName: `${lifecycleStatus}-card`,
        title: `${lifecycleStatus} card`,
      });
      const lifecycleResponse = await app
        .agent()
        .resource('jsTemplateProjects')
        .changeLifecycle({
          values: {
            projectId: fixture.projectId,
            lifecycleStatus,
          },
        });

      expect(lifecycleResponse.status).toBe(200);
      expect(lifecycleResponse.body.data.lifecycleStatus).toBe(lifecycleStatus);

      const resolveResponse = await resolveRuntimeTemplate(app, fixture);

      expect(resolveResponse.status).toBe(409);
      expect(resolveResponse.body.errors?.[0]).toMatchObject({
        code: 'JS_TEMPLATE_RUNTIME_UNAVAILABLE',
        details: {
          projectId: fixture.projectId,
          templateId: fixture.templateId,
          reasonCode,
        },
      });

      const artifactResponse = await getRuntimeArtifact(app, fixture.artifactHash);

      expect(artifactResponse.status).toBe(200);
      expect(artifactResponse.body).toMatchObject({ artifactHash: fixture.artifactHash });
      expect(artifactResponse.headers['cache-control']).toBe(IMMUTABLE_CACHE_CONTROL);
    },
  );

  it('removes an Artifact after deleting its last Template reference and returns 404 on the next origin request', async () => {
    const fixture = await createRuntimeTemplate(app, {
      projectName: 'artifact-last-reference-source',
      templateName: 'last-reference-card',
      title: 'Last reference card',
    });

    const deleteResponse = await app
      .agent()
      .resource('jsTemplates')
      .delete({
        values: { templateId: fixture.templateId },
      });

    expect(deleteResponse.status).toBe(200);
    expect(await app.db.getRepository('jsTemplateArtifacts').findOne({ filterByTk: fixture.artifactHash })).toBeNull();

    const artifactResponse = await getRuntimeArtifact(app, fixture.artifactHash);

    expect(artifactResponse.status).toBe(404);
    expect(artifactResponse.body.errors?.[0]).toMatchObject({
      code: 'JS_TEMPLATE_ARTIFACT_NOT_FOUND',
      details: {
        artifactHash: fixture.artifactHash,
        reasonCode: 'artifact_missing',
      },
    });
  });

  it('keeps a shared Artifact while another Template still references it', async () => {
    const first = await createRuntimeTemplate(app, {
      projectName: 'artifact-shared-source-one',
      templateName: 'shared-card',
      title: 'Shared card',
    });
    const second = await createRuntimeTemplate(app, {
      projectName: 'artifact-shared-source-two',
      templateName: 'shared-card',
      title: 'Shared card',
    });

    expect(second.artifactHash).toBe(first.artifactHash);
    expect(await app.db.getRepository('jsTemplates').count({ filter: { artifactHash: first.artifactHash } })).toBe(2);

    const deleteResponse = await app
      .agent()
      .resource('jsTemplates')
      .delete({
        values: { templateId: first.templateId },
      });

    expect(deleteResponse.status).toBe(200);
    expect(await app.db.getRepository('jsTemplateArtifacts').findOne({ filterByTk: first.artifactHash })).toBeTruthy();
    expect(await app.db.getRepository('jsTemplates').count({ filter: { artifactHash: first.artifactHash } })).toBe(1);

    const remainingResolve = await resolveRuntimeTemplate(app, second);
    const artifactResponse = await getRuntimeArtifact(app, first.artifactHash);

    expect(remainingResolve.status).toBe(200);
    expect(remainingResolve.body.data).toMatchObject({ artifactHash: first.artifactHash });
    expect(artifactResponse.status).toBe(200);
    expect(artifactResponse.body).toMatchObject({ artifactHash: first.artifactHash });
    expect(artifactResponse.headers['cache-control']).toBe(IMMUTABLE_CACHE_CONTROL);
  });
});

async function createRuntimeTemplate(
  app: MockServer,
  input: { projectName: string; templateName: string; title: string },
): Promise<RuntimeTemplateFixture> {
  const createResponse = await app
    .agent()
    .resource('jsTemplateProjects')
    .create({
      values: {
        name: input.projectName,
        title: input.title,
        initialFiles: createJsTemplateEntryStarter({
          kind: 'js-block',
          templateName: input.templateName,
          title: input.title,
        }),
        message: `Create ${input.title} lifecycle fixture`,
      },
    });

  expect(createResponse.status).toBe(202);
  const projectId = String(createResponse.body.data.targetProjectId);
  await waitForSuccessfulCreate(app, String(createResponse.body.data.id), projectId);

  const template = await app.db.getRepository('jsTemplates').findOne({
    filter: { projectId, templateName: input.templateName },
  });
  if (!template) {
    throw new Error(`Expected Template "${input.templateName}" to be compiled`);
  }

  const fixture = {
    artifactHash: String(template.get('artifactHash')),
    artifactUrl: '',
    projectId,
    templateId: String(template.get('id')),
  };
  const resolveResponse = await resolveRuntimeTemplate(app, fixture);

  expect(resolveResponse.status).toBe(200);
  expect(resolveResponse.body.data).toMatchObject({
    artifactHash: fixture.artifactHash,
    templateId: fixture.templateId,
  });

  return {
    ...fixture,
    artifactUrl: String(resolveResponse.body.data.artifactUrl),
  };
}

function resolveRuntimeTemplate(app: MockServer, fixture: Pick<RuntimeTemplateFixture, 'projectId' | 'templateId'>) {
  return app
    .agent()
    .resource('jsTemplateRuntime')
    .resolve({
      values: {
        sourceMode: 'js-template',
        sourceBinding: {
          type: 'js-template-entry',
          projectId: fixture.projectId,
          templateId: fixture.templateId,
          kind: 'js-block',
        },
        settings: {},
      },
    });
}

function getRuntimeArtifact(app: MockServer, artifactHash: string) {
  // The production URL includes the configured /api base path. MockServer's resource prefix is empty, so issue the
  // same GET against its mounted resource path while retaining the production URL assertion above.
  return app.agent().get(`/jsTemplateRuntime:getArtifact/${artifactHash}`);
}

async function waitForSuccessfulCreate(app: MockServer, jobId: string, projectId: string): Promise<void> {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const job = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: jobId });
    if (job?.get('status') === 'failed') {
      throw new Error(`Creation job ${jobId} failed with ${String(job.get('errorCode'))}`);
    }
    if (job?.get('status') === 'succeeded' && job.get('resultProjectId') === projectId) {
      const project = await app.db.getRepository('jsTemplateProjects').findOne({ filterByTk: projectId });
      if (project) {
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Creation job ${jobId} did not finish`);
}
