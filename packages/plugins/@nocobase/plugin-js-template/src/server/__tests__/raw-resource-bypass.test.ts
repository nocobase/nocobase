/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  VscFileService,
  type RunJSLegacySource,
  type RunJSSourceAdapter,
  type RunJSSourceLocator,
} from '@nocobase/runjs-workspace/server';
import { MockServer, createMockServer } from '@nocobase/test';
import PluginFlowEngineServer from '@nocobase/plugin-flow-engine';

import PluginJsTemplateServer from '../plugin';

type FlowModelStepLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.step' }>;

describe('plugin-js-template raw resource bypass guard', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;
  let vscRepoId: string;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [
        'field-sort',
        'users',
        'auth',
        'acl',
        'data-source-manager',
        'system-settings',
        PluginFlowEngineServer,
        PluginJsTemplateServer,
      ],
    });

    const user = await app.db.getRepository('users').findOne();
    agent = await app.agent().login(user);
    vscRepoId = `vscr_js_template_${Date.now()}`;
    await app.db.getRepository('vscFileRepositories').create({
      values: {
        id: vscRepoId,
        ownerType: 'js-template',
        ownerId: 'jtp_raw_guard',
        name: 'source',
        status: 'active',
        defaultRef: 'head',
        headSeq: 0,
      },
    });
    registerRunJSSourceAdapter();
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('does not register the raw vscFile HTTP resource', () => {
    expect(() => app.resourceManager.getResource('vscFile')).toThrow('vscFile resource does not exist');
  });

  it('propagates a correlation id through RunJS owner denials without leaking source', async () => {
    const requestId = 'req_header_runjs_source';
    const response = await agent
      .set('x-correlation-id', requestId)
      .resource('runJSSources')
      .compilePreview({
        values: {
          locator: createLocator(),
          repoId: vscRepoId,
          baseCommitId: null,
          files: [
            {
              path: 'src/client/index.tsx',
              operation: 'upsert',
              content: 'ctx.render("header secret");',
              language: 'typescript',
            },
          ],
          entryPath: 'src/client/index.tsx',
          version: 'v2',
        },
      });

    expect(response.status).toBe(403);
    expect(response.body.errors[0].details).toMatchObject({
      rawResourceAction: 'runJSSources:compilePreview',
      requestId,
    });

    const log = await app.db.getRepository('jsTemplateLogs').findOne({
      filter: {
        requestId,
      },
    });
    expect(log?.get('rawResourceAction')).toBe('runJSSources:compilePreview');
    expect(JSON.stringify(log?.toJSON())).not.toContain('header secret');
  });

  it('rejects direct runJSSources preview and save paths for js-template repositories', async () => {
    const locator = createLocator();
    const preview = await agent.resource('runJSSources').compilePreview({
      values: {
        locator,
        repoId: vscRepoId,
        baseCommitId: null,
        files: [
          {
            path: 'src/client/index.tsx',
            operation: 'upsert',
            content: 'ctx.render("preview secret");',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });
    const save = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: vscRepoId,
        baseCommitId: null,
        baseOwnerFingerprint: 'raw-resource-owner',
        message: 'raw save should fail',
        files: [
          {
            path: 'src/client/index.tsx',
            operation: 'upsert',
            content: 'ctx.render("save secret");',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });
    const saveChanges = await agent.resource('runJSSources').saveChanges({
      values: {
        locator,
        repoId: vscRepoId,
        baseCommitId: null,
        baseOwnerFingerprint: 'raw-resource-owner',
        message: 'raw incremental save should fail',
        changes: [
          {
            path: 'src/client/helper.ts',
            operation: 'upsert',
            expectedBlobHash: null,
            content: 'export const secret = "save changes secret";',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(preview.status).toBe(403);
    expect(save.status).toBe(403);
    expect(saveChanges.status).toBe(403);
    expect(preview.body.errors[0].details).toMatchObject({
      ownerType: 'js-template',
      rawResourceAction: 'runJSSources:compilePreview',
      result: 'denied',
    });
    expect(save.body.errors[0].details).toMatchObject({
      ownerType: 'js-template',
      rawResourceAction: 'runJSSources:save',
      result: 'denied',
    });
    expect(saveChanges.body.errors[0].details).toMatchObject({
      ownerType: 'js-template',
      rawResourceAction: 'runJSSources:saveChanges',
      result: 'denied',
    });

    const logs = await app.db.getRepository('jsTemplateLogs').find({
      filter: {
        projectId: 'jtp_raw_guard',
        result: 'denied',
      },
    });
    const serializedLogs = JSON.stringify(logs.map((log) => log.toJSON()));

    expect(logs.map((log) => log.get('rawResourceAction'))).toEqual(
      expect.arrayContaining(['runJSSources:compilePreview', 'runJSSources:save', 'runJSSources:saveChanges']),
    );
    expect(serializedLogs).not.toContain('preview secret');
    expect(serializedLogs).not.toContain('save secret');
    expect(serializedLogs).not.toContain('save changes secret');
    expect(serializedLogs).not.toContain(vscRepoId);
  });

  it('keeps js-template vsc owners protected when VscFileService is constructed without hooks', async () => {
    const service = new VscFileService(app.db);

    await expect(
      service.getRepository({
        repoId: vscRepoId,
      }),
    ).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        ownerType: 'js-template',
        rawResourceAction: 'getRepository',
        result: 'denied',
        denyReason: 'protected_owner_requires_permission_hook',
      },
    });
  });

  function getJsTemplatePlugin(): PluginJsTemplateServer {
    return app.pm.get(PluginJsTemplateServer) as PluginJsTemplateServer;
  }

  function registerRunJSSourceAdapter() {
    const legacy: RunJSLegacySource = {
      code: 'ctx.render("legacy");',
      version: 'v2',
      label: 'JS Template raw guard',
      surfaceStyle: 'render',
      language: 'typescript',
      ownerFingerprint: 'owner:v1',
    };
    const adapter: RunJSSourceAdapter<FlowModelStepLocator> = {
      kind: 'flowModel.step',
      readLegacy: () => legacy,
      writeRuntime: () => ({
        ownerFingerprint: 'owner:v2',
      }),
      getFingerprint: () => legacy.ownerFingerprint,
      assertCanRead: () => undefined,
      assertCanWrite: () => undefined,
    };

    getJsTemplatePlugin().registerRunJSSourceAdapter(adapter);
  }

  function createLocator(): FlowModelStepLocator {
    return {
      kind: 'flowModel.step',
      modelUid: 'fm_js_template_raw_guard',
      flowKey: 'default',
      stepKey: 'runjs',
      paramPath: ['code'],
    };
  }
});
