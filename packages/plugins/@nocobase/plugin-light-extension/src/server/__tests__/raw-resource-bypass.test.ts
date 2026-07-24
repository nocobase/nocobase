/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSLegacySource, RunJSSourceAdapter, RunJSSourceLocator } from '../vsc-file';
import { VscFileService } from '../vsc-file';
import { MockServer, createMockServer } from '@nocobase/test';

import PluginLightExtensionServer from '../plugin';

type FlowModelStepLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.step' }>;

describe('plugin-light-extension raw resource bypass guard', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;
  let repoId: string;

  beforeEach(async () => {
    await setupApp([PluginLightExtensionServer]);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  async function setupApp(plugins: unknown[]) {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['field-sort', 'users', 'auth', 'acl', 'data-source-manager', 'system-settings', ...plugins],
    });

    const user = await app.db.getRepository('users').findOne();
    agent = await app.agent().login(user);
    repoId = `vscr_light_${Date.now()}`;
    await app.db.getRepository('vscFileRepositories').create({
      values: {
        id: repoId,
        ownerType: 'light-extension',
        ownerId: 'ler_raw_guard',
        name: 'source',
        status: 'active',
        defaultRef: 'head',
        headSeq: 0,
      },
    });
    registerRunJSSourceAdapter();
  }

  it('rejects direct vscFile access for light-extension repositories and records sanitized audit rows', async () => {
    const responses = [
      await agent.resource('vscFile').createRepository({
        values: {
          ownerType: 'light-extension',
          ownerId: 'ler_raw_guard_create',
          name: 'raw-create',
          defaultRef: 'head',
          metadata: {
            settings: {
              token: 'create-settings-secret',
            },
            code: 'ctx.render("create secret");',
          },
        },
      }),
      await agent.resource('vscFile').getRepository({ values: { repoId } }),
      await agent.resource('vscFile').pull({ values: { repoId, includeContent: 'all' } }),
      await agent.resource('vscFile').getFile({ values: { repoId, path: 'src/client/index.tsx' } }),
      await agent.resource('vscFile').push({
        values: {
          repoId,
          baseCommitId: null,
          message: 'raw push should fail',
          files: [
            {
              path: 'src/client/index.tsx',
              content: 'ctx.render("raw secret");',
            },
          ],
          metadata: {
            code: 'ctx.render("metadata secret");',
            sourceMap: 'metadata-source-map-secret',
            settings: {
              token: 'metadata-settings-secret',
            },
          },
        },
      }),
      await agent.resource('vscFile').listRefs({ values: { repoId } }),
      await agent.resource('vscFile').updateRef({
        values: {
          repoId,
          name: 'head',
          targetCommitId: 'commit_raw',
        },
      }),
      await agent.resource('vscFile').archiveRepository({ values: { repoId } }),
    ];

    for (const response of responses) {
      expect(response.status).toBe(403);
      expect(response.body.errors[0]).toMatchObject({
        code: 'PERMISSION_DENIED',
        status: 403,
        details: {
          ownerType: 'light-extension',
          result: 'denied',
          denyReason: 'raw_resource_forbidden',
        },
      });
      expect(typeof response.body.errors[0].details.requestId).toBe('string');
    }

    const logs = await app.db.getRepository('lightExtensionLogs').find({
      filter: {
        result: 'denied',
      },
      sort: ['createdAt'],
    });
    const rawResourceActions = logs.map((log) => log.get('rawResourceAction'));

    expect(rawResourceActions).toEqual(
      expect.arrayContaining([
        'vscFile:getRepository',
        'vscFile:createRepository',
        'vscFile:pull',
        'vscFile:getFile',
        'vscFile:push',
        'vscFile:listRefs',
        'vscFile:updateRef',
        'vscFile:archiveRepository',
      ]),
    );
    expect(logs.every((log) => typeof log.get('requestId') === 'string')).toBe(true);
    const serializedLogs = JSON.stringify(logs.map((log) => log.toJSON()));
    expect(serializedLogs).not.toContain(repoId);
    expect(serializedLogs).not.toContain('raw secret');
    expect(serializedLogs).not.toContain('create secret');
    expect(serializedLogs).not.toContain('create-settings-secret');
    expect(serializedLogs).not.toContain('metadata secret');
    expect(serializedLogs).not.toContain('metadata-source-map-secret');
    expect(serializedLogs).not.toContain('metadata-settings-secret');
  });

  it('propagates request id and correlation id headers into deny details and audit logs', async () => {
    const user = await app.db.getRepository('users').findOne();
    const vscRequestId = 'req_header_vsc_file';
    const vscResponse = await (await app.agent().login(user))
      .set('x-request-id', vscRequestId)
      .resource('vscFile')
      .getRepository({ values: { repoId } });

    expect(vscResponse.status).toBe(403);
    expect(vscResponse.body.errors[0].details).toMatchObject({
      rawResourceAction: 'vscFile:getRepository',
      requestId: vscRequestId,
    });

    const vscLog = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        requestId: vscRequestId,
      },
    });
    expect(vscLog?.get('rawResourceAction')).toBe('vscFile:getRepository');

    const runjsRequestId = 'req_header_runjs_source';
    const runjsResponse = await (
      await app.agent().login(user)
    )
      .set('x-correlation-id', runjsRequestId)
      .resource('runJSSources')
      .compilePreview({
        values: {
          locator: createLocator(),
          repoId,
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

    expect(runjsResponse.status).toBe(403);
    expect(runjsResponse.body.errors[0].details).toMatchObject({
      rawResourceAction: 'runJSSources:compilePreview',
      requestId: runjsRequestId,
    });

    const runjsLog = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        requestId: runjsRequestId,
      },
    });
    expect(runjsLog?.get('rawResourceAction')).toBe('runJSSources:compilePreview');
    expect(JSON.stringify(runjsLog?.toJSON())).not.toContain('header secret');
  });

  it('rejects direct runJSSources preview and save paths for light-extension repositories', async () => {
    const locator = createLocator();
    const preview = await agent.resource('runJSSources').compilePreview({
      values: {
        locator,
        repoId,
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
        repoId,
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

    expect(preview.status).toBe(403);
    expect(save.status).toBe(403);
    expect(preview.body.errors[0].details).toMatchObject({
      ownerType: 'light-extension',
      rawResourceAction: 'runJSSources:compilePreview',
      result: 'denied',
    });
    expect(save.body.errors[0].details).toMatchObject({
      ownerType: 'light-extension',
      rawResourceAction: 'runJSSources:save',
      result: 'denied',
    });

    const logs = await app.db.getRepository('lightExtensionLogs').find({
      filter: {
        repoId: 'ler_raw_guard',
        result: 'denied',
      },
    });
    const serializedLogs = JSON.stringify(logs.map((log) => log.toJSON()));

    expect(logs.map((log) => log.get('rawResourceAction'))).toEqual(
      expect.arrayContaining(['runJSSources:compilePreview', 'runJSSources:save']),
    );
    expect(serializedLogs).not.toContain('preview secret');
    expect(serializedLogs).not.toContain('save secret');
    expect(serializedLogs).not.toContain(repoId);
  });

  it('registers the owner hook without a second plugin instance', async () => {
    const response = await agent.resource('vscFile').getRepository({ values: { repoId } });

    expect(response.status).toBe(403);
    expect(response.body.errors[0].details).toMatchObject({
      ownerType: 'light-extension',
      rawResourceAction: 'vscFile:getRepository',
      result: 'denied',
    });

    const log = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        repoId: 'ler_raw_guard',
        rawResourceAction: 'vscFile:getRepository',
        result: 'denied',
      },
    });
    expect(log).toBeTruthy();
    expect(JSON.stringify(log?.toJSON())).not.toContain(repoId);
  });

  it('keeps light-extension vsc owners protected after the light-extension hook is unregistered', async () => {
    await getLightExtensionPlugin().afterDisable();

    const response = await agent.resource('vscFile').getRepository({ values: { repoId } });

    expect(response.status).toBe(403);
    expect(response.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        ownerType: 'light-extension',
        rawResourceAction: 'vscFile:getRepository',
        result: 'denied',
        denyReason: 'protected_owner_requires_permission_hook',
      },
    });
  });

  it('keeps light-extension vsc owners protected when VscFileService is constructed without hooks', async () => {
    const service = new VscFileService(app.db);

    await expect(
      service.getRepository({
        repoId,
      }),
    ).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        ownerType: 'light-extension',
        rawResourceAction: 'getRepository',
        result: 'denied',
        denyReason: 'protected_owner_requires_permission_hook',
      },
    });
  });

  function getLightExtensionPlugin(): PluginLightExtensionServer {
    return app.pm.get(PluginLightExtensionServer) as PluginLightExtensionServer;
  }

  function registerRunJSSourceAdapter() {
    const legacy: RunJSLegacySource = {
      code: 'ctx.render("legacy");',
      version: 'v2',
      label: 'Light extension raw guard',
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

    getLightExtensionPlugin().registerRunJSSourceAdapter(adapter);
  }

  function createLocator(): FlowModelStepLocator {
    return {
      kind: 'flowModel.step',
      modelUid: 'fm_light_raw_guard',
      flowKey: 'default',
      stepKey: 'runjs',
      paramPath: ['code'],
    };
  }
});
