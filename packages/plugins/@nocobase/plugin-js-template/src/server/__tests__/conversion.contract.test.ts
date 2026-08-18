/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';
import type { RunJSSourceLocator } from '@nocobase/runjs/workspace/server';
import { vi } from 'vitest';

import FlowModelRepository from '../../../../plugin-flow-engine/src/server/repository';
import type { JsTemplateKind } from '../../shared/types';
import PluginJsTemplateServer from '../plugin';
import type { JsTemplateAuditService } from '../services/JsTemplateAuditService';
import type { JsTemplateProjectService } from '../services/JsTemplateProjectService';

type ConversionCase = {
  kind: JsTemplateKind;
  modelUse: 'JSBlockModel' | 'JSActionModel' | 'JSFieldModel' | 'JSItemModel';
  flowKey: 'jsSettings' | 'clickSettings';
  extension: 'ts' | 'tsx';
  entryRoot: string;
  source: string;
};

const conversionCases: ConversionCase[] = [
  {
    kind: 'js-block',
    modelUse: 'JSBlockModel',
    flowKey: 'jsSettings',
    extension: 'tsx',
    entryRoot: 'src/client/js-blocks',
    source: 'import { label } from "./runtime";\nctx.render(<div>{label}</div>);\n',
  },
  {
    kind: 'js-action',
    modelUse: 'JSActionModel',
    flowKey: 'clickSettings',
    extension: 'ts',
    entryRoot: 'src/client/js-actions',
    source: 'import { label } from "./runtime";\nreturn label;\n',
  },
  {
    kind: 'js-field',
    modelUse: 'JSFieldModel',
    flowKey: 'jsSettings',
    extension: 'tsx',
    entryRoot: 'src/client/js-fields',
    source: 'import { label } from "./runtime";\nctx.render(<span>{label}</span>);\n',
  },
  {
    kind: 'js-item',
    modelUse: 'JSItemModel',
    flowKey: 'jsSettings',
    extension: 'tsx',
    entryRoot: 'src/client/js-items',
    source: 'import { label } from "./runtime";\nctx.render(<span>{label}</span>);\n',
  },
];

describe('JS Template conversion transaction contract', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;
  let flowModels: FlowModelRepository;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [
        'field-sort',
        'system-settings',
        'users',
        'auth',
        'acl',
        'data-source-manager',
        PluginJsTemplateServer,
        'flow-engine',
      ],
    });
    flowModels = app.db.getCollection('flowModels').repository as FlowModelRepository;
    agent = await app.agent().login(await app.db.getRepository('users').findOne());
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it.each(conversionCases)(
    'converts $kind Inline -> Template -> Inline with its reachable value/type closure',
    async (contract) => {
      const fixture = await createInlineFixture(contract, contract.kind);
      const saved = await saveAsTemplate(fixture, contract);

      expect(saved.status).toBe(200);
      expect(saved.body.data.binding).toMatchObject({
        type: 'js-template-entry',
        projectId: saved.body.data.project.id,
        templateId: saved.body.data.template.id,
        kind: contract.kind,
      });
      const templateSource = await agent.resource('jsTemplateFiles').pull({
        values: { projectId: saved.body.data.project.id, includeContent: 'all' },
      });
      expect(templateSource.status).toBe(200);
      expect(templateSource.body.data.files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: `${contract.entryRoot}/${contract.kind}/index.${contract.extension}`,
            content: expect.stringContaining('./runtime'),
          }),
          expect.objectContaining({
            path: `${contract.entryRoot}/${contract.kind}/runtime.ts`,
            content: expect.stringContaining('import type'),
          }),
          expect.objectContaining({ path: `${contract.entryRoot}/${contract.kind}/types.ts` }),
        ]),
      );
      const detached = await agent.resource('jsTemplates').detachToInline({
        values: {
          idempotencyKey: `detach-${contract.kind}`,
          expectedProjectHeadCommitId: saved.body.data.project.headCommitId,
          locator: fixture.locator,
          projectId: saved.body.data.project.id,
          templateId: saved.body.data.template.id,
        },
      });

      expect(detached.status).toBe(200);
      const host = await flowModels.findModelById(fixture.uid);
      expect(host.stepParams[contract.flowKey].runJs).toMatchObject({
        sourceMode: 'inline',
        sourceRef: {
          type: 'vsc-file',
          repoId: detached.body.data.runJSRepoId,
          commitId: detached.body.data.commitId,
        },
      });
      expect(host.stepParams[contract.flowKey].runJs).not.toHaveProperty('sourceBinding');
      const reopened = await agent.resource('runJSSources').open({ values: { locator: fixture.locator } });
      expect(reopened.body.data.files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'src/client/index.' + contract.extension }),
          expect.objectContaining({ path: 'src/client/runtime.ts', content: expect.stringContaining('import type') }),
          expect.objectContaining({ path: 'src/client/types.ts' }),
        ]),
      );
      expect(reopened.body.data.files.some((file: { path: string }) => file.path.endsWith('/unreachable.ts'))).toBe(
        false,
      );
    },
  );

  it.each([
    ['owner fingerprint', { expectedOwnerFingerprint: 'stale-owner' }],
    ['Source Project Head', { sourceHeadCommitId: 'stale-head' }],
    ['illegal path', { files: [{ path: '../escape.ts', content: 'export const escaped = true;' }] }],
  ] as const)('rejects a stale or invalid %s without changing conversion state', async (_label, override) => {
    const contract = conversionCases[0];
    const fixture = await createInlineFixture(contract, `rejected-${_label.replaceAll(' ', '-')}`);
    const before = await captureState(fixture.uid);

    const response = await saveAsTemplate(fixture, contract, override);

    expect(response.status).toBeGreaterThanOrEqual(400);
    await expect(captureState(fixture.uid)).resolves.toEqual(before);
  });

  it('rolls back Head, files, templates, artifacts, usages, host binding, and audit after a late failure', async () => {
    const contract = conversionCases[0];
    const fixture = await createInlineFixture(contract, 'late-failure');
    const plugin = app.pm.get(PluginJsTemplateServer) as unknown as {
      saveAsJsTemplateService: { auditService: JsTemplateAuditService };
    };
    const audit = plugin.saveAsJsTemplateService.auditService;
    const original = audit.recordLifecycleEvent.bind(audit);
    vi.spyOn(audit, 'recordLifecycleEvent').mockImplementation(async (input) => {
      if (input.action === 'saveAsJsTemplate' && input.result === 'success') {
        throw new Error('forced late conversion audit failure');
      }
      return original(input);
    });
    const before = await captureState(fixture.uid);

    const response = await saveAsTemplate(fixture, contract);

    expect(response.status).toBe(500);
    await expect(captureState(fixture.uid)).resolves.toEqual(before);
  });

  it('rejects a stale Template Project Head before detaching without changing conversion state', async () => {
    const contract = conversionCases[0];
    const fixture = await createInlineFixture(contract, 'detach-stale-head');
    const saved = await saveAsTemplate(fixture, contract);
    expect(saved.status).toBe(200);
    const before = await captureState(fixture.uid);

    const response = await detachToInline(fixture, saved, 'detach-stale-head', 'stale-project-head');

    expect(response.status).toBe(409);
    expect(response.body.errors[0]).toMatchObject({ code: 'JS_TEMPLATE_SOURCE_OUTDATED' });
    await expect(captureState(fixture.uid)).resolves.toEqual(before);
  });

  it('rechecks the Template Project Head under lock before committing Inline source', async () => {
    const contract = conversionCases[0];
    const fixture = await createInlineFixture(contract, 'detach-head-race');
    const saved = await saveAsTemplate(fixture, contract);
    expect(saved.status).toBe(200);
    const plugin = app.pm.get(PluginJsTemplateServer) as unknown as {
      detachToInlineService: { projectService: JsTemplateProjectService };
    };
    const projectService = plugin.detachToInlineService.projectService;
    const lockProject = projectService.lockInternalProjectForUpdate.bind(projectService);
    vi.spyOn(projectService, 'lockInternalProjectForUpdate').mockImplementationOnce(async (...args) => ({
      ...(await lockProject(...args)),
      headCommitId: 'project-head-changed-under-lock',
    }));
    const before = await captureState(fixture.uid);

    const response = await detachToInline(fixture, saved, 'detach-head-race');

    expect(response.status).toBe(409);
    expect(response.body.errors[0]).toMatchObject({ code: 'JS_TEMPLATE_SOURCE_OUTDATED' });
    await expect(captureState(fixture.uid)).resolves.toEqual(before);
  });

  it('rolls back detach repository, Head, host binding, usage, and audit after a late failure', async () => {
    const contract = conversionCases[0];
    const fixture = await createInlineFixture(contract, 'detach-late-failure');
    const saved = await saveAsTemplate(fixture, contract);
    expect(saved.status).toBe(200);
    const plugin = app.pm.get(PluginJsTemplateServer) as unknown as {
      detachToInlineService: { auditService: JsTemplateAuditService };
    };
    const audit = plugin.detachToInlineService.auditService;
    const recordLifecycleEvent = audit.recordLifecycleEvent.bind(audit);
    vi.spyOn(audit, 'recordLifecycleEvent').mockImplementation(async (input) => {
      if (input.action === 'detachJsTemplateToInline' && input.result === 'success') {
        throw new Error('forced late detach audit failure');
      }
      return recordLifecycleEvent(input);
    });
    const before = await captureState(fixture.uid);

    const response = await detachToInline(fixture, saved, 'detach-late-failure');

    expect(response.status).toBe(500);
    await expect(captureState(fixture.uid)).resolves.toEqual(before);
  });

  async function createInlineFixture(contract: ConversionCase, suffix: string) {
    const uid = `conversion-${suffix}`;
    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: uid,
      flowKey: contract.flowKey,
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    await flowModels.insertModel({
      uid,
      use: contract.modelUse,
      stepParams: {
        [contract.flowKey]: { runJs: { code: contract.source, version: 'v2' } },
      },
    });
    const opened = await agent.resource('runJSSources').open({ values: { locator } });
    const entryPath = `src/client/index.${contract.extension}`;
    const files = [
      { path: entryPath, content: contract.source, language: 'typescript', operation: 'upsert' },
      {
        path: 'src/client/runtime.ts',
        content: 'import type { Label } from "./types";\nexport const label: Label = "reachable";\n',
        language: 'typescript',
        operation: 'upsert',
      },
      {
        path: 'src/client/types.ts',
        content: 'export type Label = string;\n',
        language: 'typescript',
        operation: 'upsert',
      },
      {
        path: 'src/client/unreachable.ts',
        content: 'export const unused = true;\n',
        language: 'typescript',
        operation: 'upsert',
      },
    ];
    const saved = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.repoId,
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
        message: `Prepare ${contract.kind} conversion source`,
        entryPath,
        files,
      },
    });
    expect(saved.status).toBe(200);
    return {
      uid,
      locator,
      entryPath,
      files: files.map(({ operation: _operation, ...file }) => file),
      repoId: saved.body.data.repository.id,
      headCommitId: saved.body.data.commit.id,
      ownerFingerprint: saved.body.data.ownerFingerprint,
    };
  }

  async function saveAsTemplate(
    fixture: Awaited<ReturnType<typeof createInlineFixture>>,
    contract: ConversionCase,
    override: Record<string, unknown> = {},
  ) {
    return agent.resource('jsTemplates').saveAsJsTemplate({
      values: {
        idempotencyKey: `save-${fixture.uid}-${String(override.expectedOwnerFingerprint || 'current')}`,
        locator: fixture.locator,
        expectedOwnerFingerprint: fixture.ownerFingerprint,
        sourceRepoId: fixture.repoId,
        sourceHeadCommitId: fixture.headCommitId,
        entryPath: fixture.entryPath,
        runtimeVersion: 'v2',
        files: fixture.files,
        destination: { type: 'new', name: `Conversion ${fixture.uid}` },
        templateName: contract.kind,
        ...override,
      },
    });
  }

  async function detachToInline(
    fixture: Awaited<ReturnType<typeof createInlineFixture>>,
    saved: Awaited<ReturnType<typeof saveAsTemplate>>,
    idempotencyKey: string,
    expectedProjectHeadCommitId = saved.body.data.project.headCommitId,
  ) {
    return agent.resource('jsTemplates').detachToInline({
      values: {
        idempotencyKey,
        expectedProjectHeadCommitId,
        locator: fixture.locator,
        projectId: saved.body.data.project.id,
        templateId: saved.body.data.template.id,
      },
    });
  }

  async function captureState(uid: string) {
    const repositories = [
      'vscFileRepositories',
      'vscFileCommits',
      'vscFileTrees',
      'vscFileBlobs',
      'jsTemplateProjects',
      'jsTemplates',
      'jsTemplateArtifacts',
      'jsTemplateUsages',
      'jsTemplateLogs',
    ];
    const counts = Object.fromEntries(
      await Promise.all(repositories.map(async (name) => [name, await app.db.getRepository(name).count()])),
    );
    const vscHeads = (await app.db.getRepository('vscFileRepositories').find())
      .map((repository) => ({ id: repository.get('id'), headCommitId: repository.get('headCommitId') }))
      .sort((left, right) => String(left.id).localeCompare(String(right.id)));
    const projectHeads = (await app.db.getRepository('jsTemplateProjects').find())
      .map((project) => ({ id: project.get('id'), headCommitId: project.get('headCommitId') }))
      .sort((left, right) => String(left.id).localeCompare(String(right.id)));
    return {
      counts,
      vscHeads,
      projectHeads,
      host: JSON.parse(JSON.stringify(await flowModels.findModelById(uid))),
    };
  }
});
