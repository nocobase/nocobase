/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import PluginJsTemplateServer from '../../../../plugin-js-template/src/server';
import {
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { FLOW_SURFACES_TEST_PLUGIN_INSTALLS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

type JsTemplateBinding = {
  type: 'js-template-entry';
  projectId: string;
  templateId: string;
  kind: 'js-block';
};

const TEMPLATE_NAMES = ['binding-card', 'updated-card', 'protected-card'] as const;

describe('flowSurfaces JS block JS Template public contract', () => {
  let context: FlowSurfacesContractContext;
  let projectId: string;
  const bindings = new Map<(typeof TEMPLATE_NAMES)[number], JsTemplateBinding>();

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext({
      enabledPluginAliases: [...FLOW_SURFACES_TEST_PLUGINS, 'js-template'],
      plugins: [
        ...FLOW_SURFACES_TEST_PLUGIN_INSTALLS,
        [PluginJsTemplateServer, { name: 'js-template', packageName: '@nocobase/plugin-js-template' }],
      ],
    });
    const projectName = `flow-surface-contract-${Date.now()}`;
    const createResponse = await context.rootAgent.resource('jsTemplateProjects').create({
      values: {
        idempotencyKey: `flow-surfaces:${projectName}`,
        name: projectName,
        title: 'Flow Surface JS Block contract',
        initialFiles: TEMPLATE_NAMES.flatMap((templateName) => createTemplateFiles(templateName)),
        message: 'Create Flow Surface contract templates',
      },
    });
    expect(createResponse.status, readErrorMessage(createResponse)).toBe(202);
    projectId = String(createResponse.body.data.targetProjectId);
    await waitForSuccessfulCreate(context, String(createResponse.body.data.id), projectId);

    const templatesResponse = await context.rootAgent.resource('jsTemplates').list({ values: { projectId } });
    expect(templatesResponse.status, readErrorMessage(templatesResponse)).toBe(200);
    for (const templateName of TEMPLATE_NAMES) {
      const template = templatesResponse.body.data.find(
        (item: { templateName?: string }) => item.templateName === templateName,
      );
      expect(template).toBeTruthy();
      bindings.set(templateName, {
        type: 'js-template-entry',
        projectId,
        templateId: String(template.id),
        kind: 'js-block',
      });
    }
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('resolves an executable artifact for a JS Block binding created through the public API', async () => {
    const binding = getBinding(bindings, 'binding-card');
    const block = await createBoundBlock(context, binding, 'Binding contract block');
    const readback = await getSurface(context.rootAgent, { uid: block.uid });
    expect(readback.tree.stepParams?.jsSettings?.runJs).toMatchObject({
      sourceMode: 'js-template',
      sourceBinding: binding,
      settings: { label: 'BOUND' },
    });

    const resolvedResponse = await context.rootAgent.resource('jsTemplateRuntime').resolve({
      values: {
        sourceMode: 'js-template',
        sourceBinding: binding,
        settings: { label: 'BOUND' },
      },
    });
    expect(resolvedResponse.status, readErrorMessage(resolvedResponse)).toBe(200);
    expect(resolvedResponse.body.data).toMatchObject({
      templateId: binding.templateId,
      artifactHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
      settings: { label: 'BOUND' },
    });
    const artifactResponse = await context.rootAgent.resource('jsTemplateRuntime').getArtifact({
      filterByTk: resolvedResponse.body.data.artifactHash,
    });
    expect(artifactResponse.status, readErrorMessage(artifactResponse)).toBe(200);
    expect(artifactResponse.body).toMatchObject({
      artifactHash: resolvedResponse.body.data.artifactHash,
      code: expect.stringContaining('binding-card:v1'),
    });
  }, 120000);

  it('serves the updated immutable artifact to an existing JS Block binding', async () => {
    const binding = getBinding(bindings, 'updated-card');
    await createBoundBlock(context, binding, 'Updated artifact contract block');
    const beforeResponse = await context.rootAgent.resource('jsTemplateRuntime').resolve({
      values: { sourceMode: 'js-template', sourceBinding: binding, settings: { label: 'BEFORE' } },
    });
    expect(beforeResponse.status, readErrorMessage(beforeResponse)).toBe(200);

    const projectResponse = await context.rootAgent.resource('jsTemplateProjects').get({ filterByTk: projectId });
    expect(projectResponse.status, readErrorMessage(projectResponse)).toBe(200);
    const saveResponse = await context.rootAgent.resource('jsTemplateFiles').saveSource({
      values: {
        projectId,
        expectedHeadCommitId: projectResponse.body.data.headCommitId,
        message: 'Update JS Block contract artifact',
        files: [
          {
            path: 'src/client/js-blocks/updated-card/index.tsx',
            content: 'ctx.render(`updated-card:v2:${String(ctx.settings.label)}`);\n',
            language: 'typescript',
          },
        ],
      },
    });
    expect(saveResponse.status, readErrorMessage(saveResponse)).toBe(200);
    expect(saveResponse.body.data).toMatchObject({ compile: { status: 'success' }, diagnostics: [] });

    const afterResponse = await context.rootAgent.resource('jsTemplateRuntime').resolve({
      values: { sourceMode: 'js-template', sourceBinding: binding, settings: { label: 'AFTER' } },
    });
    expect(afterResponse.status, readErrorMessage(afterResponse)).toBe(200);
    expect(afterResponse.body.data.artifactHash).not.toBe(beforeResponse.body.data.artifactHash);
    const artifactResponse = await context.rootAgent.resource('jsTemplateRuntime').getArtifact({
      filterByTk: afterResponse.body.data.artifactHash,
    });
    expect(artifactResponse.status, readErrorMessage(artifactResponse)).toBe(200);
    expect(artifactResponse.body.code).toContain('updated-card:v2');
  }, 120000);

  it('blocks deletion while a JS Block references the Template', async () => {
    const binding = getBinding(bindings, 'protected-card');
    await createBoundBlock(context, binding, 'Protected template contract block');

    const blockedResponse = await context.rootAgent.resource('jsTemplates').delete({
      values: { templateId: binding.templateId },
    });
    expect(blockedResponse.status).toBe(409);
    expect(blockedResponse.body.errors[0]).toMatchObject({
      code: 'JS_TEMPLATE_USAGE_EXISTS',
      details: { templateId: binding.templateId, usageCount: 1 },
    });
  }, 120000);
});

async function createBoundBlock(context: FlowSurfacesContractContext, binding: JsTemplateBinding, title: string) {
  const page = await createPage(context.rootAgent, {
    title: `${title} page ${Date.now()}`,
    tabTitle: 'Main',
  });
  const response = await context.rootAgent.resource('flowSurfaces').addBlock({
    values: {
      target: { uid: page.tabSchemaUid },
      type: 'jsBlock',
      settings: {
        title,
        sourceMode: 'js-template',
        sourceBinding: binding,
        settings: { label: title.startsWith('Binding') ? 'BOUND' : title },
      },
    },
  });
  expect(response.status, readErrorMessage(response)).toBe(200);
  return getData(response);
}

function getBinding(
  bindings: Map<(typeof TEMPLATE_NAMES)[number], JsTemplateBinding>,
  templateName: (typeof TEMPLATE_NAMES)[number],
) {
  const binding = bindings.get(templateName);
  if (!binding) {
    throw new Error(`Missing JS Template binding for ${templateName}`);
  }
  return binding;
}

function createTemplateFiles(templateName: (typeof TEMPLATE_NAMES)[number]) {
  return [
    {
      path: `src/client/js-blocks/${templateName}/index.tsx`,
      content: `ctx.render(\`${templateName}:v1:\${String(ctx.settings.label)}\`);\n`,
      language: 'typescript',
    },
    {
      path: `src/client/js-blocks/${templateName}/entry.json`,
      content: `${JSON.stringify(
        {
          schemaVersion: 1,
          key: templateName,
          title: templateName,
          settings: {
            label: { type: 'string', default: 'DEFAULT' },
          },
        },
        null,
        2,
      )}\n`,
      language: 'json',
    },
  ];
}

async function waitForSuccessfulCreate(context: FlowSurfacesContractContext, jobId: string, expectedProjectId: string) {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const job = await context.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: jobId });
    if (job?.get('status') === 'failed') {
      throw new Error(`Creation job ${jobId} failed with ${String(job.get('errorCode'))}`);
    }
    if (job?.get('status') === 'succeeded' && job.get('resultProjectId') === expectedProjectId) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Creation job ${jobId} did not finish`);
}
