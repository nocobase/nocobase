/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { McpToolsManager } from '@nocobase/ai';
import { MockServer, createMockServer } from '@nocobase/test';
import jwt from 'jsonwebtoken';

import { collectMcpToolsFromSwagger } from '../../../../plugin-mcp-server/src/server/mcp-tools';
import { LIGHT_EXTENSION_ACL_SNIPPET } from '../../constants';
import PluginLightExtensionServer from '../plugin';

describe('plugin-light-extension MCP authoring security', () => {
  let app: MockServer;

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
        PluginLightExtensionServer,
      ],
    });
    Object.defineProperty(app, 'aiManager', {
      configurable: true,
      value: { mcpToolsManager: new McpToolsManager() },
    });
    await app.db.getRepository('applicationPlugins').updateOrCreate({
      filterKeys: ['packageName'],
      values: {
        name: 'light-extension-mcp-test',
        packageName: '@nocobase/plugin-light-extension',
        version: 'test',
        enabled: true,
        installed: true,
      },
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('uses the forwarded current role for Pull, check, and save without falling back to the default role', async () => {
    const managerRole = `lightExtensionMcpManager_${Date.now()}`;
    const restrictedRole = `lightExtensionMcpRestricted_${Date.now()}`;
    await app.db.getRepository('roles').create({
      values: { name: managerRole, snippets: [LIGHT_EXTENSION_ACL_SNIPPET] },
    });
    await app.db.getRepository('roles').create({
      values: { name: restrictedRole, snippets: [] },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        nickname: 'Light extension MCP author',
        roles: [managerRole, restrictedRole],
      },
    });
    await app.db.getRepository('rolesUsers').update({
      filter: { userId: user.id },
      values: { default: false },
    });
    await app.db.getRepository('rolesUsers').update({
      filter: { userId: user.id, roleName: managerRole },
      values: { default: true },
    });

    const managerAgent = (await app.agent().login(user)).set('x-role', managerRole);
    const createResponse = await managerAgent.resource('lightExtensionRepos').create({
      values: {
        name: 'MCP role forwarding',
        initialFiles: [
          {
            path: 'src/client/js-blocks/mcp-role-forwarding/entry.json',
            content: JSON.stringify({ schemaVersion: 1, key: 'mcp-role-forwarding', title: 'MCP role forwarding' }),
            language: 'json',
          },
          {
            path: 'src/client/js-blocks/mcp-role-forwarding/index.tsx',
            content: 'ctx.render(<div>MCP role forwarding</div>);\n',
            language: 'typescript',
          },
        ],
      },
    });
    expect(createResponse.status).toBe(200);
    const repo = createResponse.body.data as { id: string; headCommitId: string | null };
    const targetEntry = await app.db.getRepository('lightExtensionEntries').findOne({
      filter: { repoId: repo.id, kind: 'js-block' },
    });
    expect(targetEntry).toBeTruthy();
    const token = await createUserToken(app, user.id);
    const tools = await collectMcpToolsFromSwagger({
      app,
      packagePatterns: ['@nocobase/plugin-light-extension'],
    });
    const pull = getTool(tools, 'lightExtensionFiles', 'pull');
    const check = getTool(tools, 'lightExtensions', 'compileWorkspacePreview');
    const save = getTool(tools, 'lightExtensionFiles', 'saveSource');
    const restrictedContext = {
      token,
      headers: {
        'x-role': restrictedRole,
        'x-authenticator': 'basic',
      },
    };

    for (const [tool, requestBody] of [
      [pull, { repoId: repo.id, includeContent: 'all' }],
      [
        check,
        {
          repoId: repo.id,
          expectedHeadCommitId: repo.headCommitId,
          files: [{ path: 'README.md', content: '# denied preview\n' }],
        },
      ],
      [
        save,
        {
          repoId: repo.id,
          expectedHeadCommitId: repo.headCommitId,
          message: 'denied MCP save',
          files: [{ path: 'README.md', content: '# denied save\n' }],
        },
      ],
    ] as const) {
      const error = await tool.call({ requestBody }, restrictedContext).catch((reason: unknown) => reason);
      expect(JSON.parse((error as Error).message)).toMatchObject({
        status: 403,
      });
    }

    const managerContext = {
      token,
      headers: {
        'x-role': managerRole,
        'x-authenticator': 'basic',
      },
    };
    const pullResult = await pull.call({ requestBody: { repoId: repo.id, includeContent: 'all' } }, managerContext);
    const files = pullResult.data.files.map((file: { path: string; content?: string }) => ({
      path: file.path,
      content: file.content || '',
    }));
    const checkResult = await check.call(
      {
        requestBody: {
          repoId: repo.id,
          expectedHeadCommitId: repo.headCommitId,
          entryId: targetEntry?.get('id'),
          kind: 'js-block',
          entryPath: targetEntry?.get('entryPath'),
          files,
        },
      },
      managerContext,
    );
    const saveResult = await save.call(
      {
        requestBody: {
          repoId: repo.id,
          expectedHeadCommitId: repo.headCommitId,
          message: 'confirmed MCP source diff',
          files: [{ path: 'README.md', content: '# confirmed MCP save\n' }],
        },
      },
      managerContext,
    );

    expect(pullResult.data.repo.id).toBe(repo.id);
    expect(checkResult.data.accepted).toBe(true);
    expect(saveResult.data.repo.id).toBe(repo.id);
  });
});

async function createUserToken(app: MockServer, userId: number | string) {
  const tokenInfo = await app.authManager.tokenController.add({ userId });
  const expiresIn = (await app.authManager.tokenController.getConfig()).tokenExpirationTime;
  return jwt.sign(
    {
      userId,
      temp: true,
      signInTime: Date.now(),
    },
    app.authManager.jwt.secret(),
    {
      jwtid: tokenInfo.jti,
      expiresIn,
    },
  );
}

function getTool(
  tools: Awaited<ReturnType<typeof collectMcpToolsFromSwagger>>,
  resourceName: string,
  actionName: string,
) {
  const tool = tools.find((item) => item.resourceName === resourceName && item.actionName === actionName);
  if (!tool) {
    throw new Error(`Expected MCP tool ${resourceName}:${actionName}`);
  }
  return tool;
}
