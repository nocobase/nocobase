/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';

import type { RunJSSourceAdapterContext } from '../../shared/runjs-source-types';
import PluginVscFileServer from '../plugin';
import { runJSSourceActionNames } from '../runjs-sources';

describe('runJSSources resource', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;
  let currentUserId: string;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['field-sort', 'users', 'auth', 'acl', 'data-source-manager', 'system-settings', PluginVscFileServer],
    });

    const user = await app.db.getRepository('users').findOne();
    currentUserId = String(user.get('id'));
    agent = await app.agent().login(user);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('registers the RunJS source action surface', async () => {
    const resource = app.resourceManager.getResource('runJSSources');
    const actions = Array.from(resource.actions.keys()).sort();
    const expectedActions = [...runJSSourceActionNames].sort();

    expect(actions).toEqual(expectedActions);
  });

  it('returns a clear error when no adapter supports the locator kind', async () => {
    const response = await agent.resource('runJSSources').open({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_KIND_UNSUPPORTED',
      status: 400,
      details: {
        kind: 'flowModel.step',
      },
    });
  });

  it('opens a RunJS source through the registered owner adapter', async () => {
    let capturedContext: RunJSSourceAdapterContext | null = null;

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      readLegacy: (_locator, ctx) => {
        capturedContext = ctx;
        return {
          label: 'JS block / Write JavaScript',
          code: 'return ctx;',
          version: 'v2',
          entry: 'src/main.tsx',
          ownerFingerprint: 'owner:fingerprint:v1',
          surfaceStyle: 'render',
        };
      },
    });

    const response = await agent.resource('runJSSources').open({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      locatorKind: 'flowModel.step',
      repositoryIdentity: {
        ownerType: 'runjs-source',
        name: 'source',
      },
      legacy: {
        label: 'JS block / Write JavaScript',
        code: 'return ctx;',
        version: 'v2',
      },
      ownerFingerprint: 'owner:fingerprint:v1',
    });
    expect(response.body.data.repositoryIdentity.ownerId).toMatch(/^runjs:flowModel\.step:fm_1:[a-f0-9]{16}$/);
    expect(capturedContext).toMatchObject({
      userId: currentUserId,
      request: {
        resourceName: 'runJSSources',
        actionName: 'open',
      },
    });
  });

  function getPlugin(): PluginVscFileServer {
    return app.pm.get(PluginVscFileServer) as PluginVscFileServer;
  }
});
