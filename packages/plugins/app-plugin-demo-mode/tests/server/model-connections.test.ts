import { randomUUID } from 'node:crypto';
import { createTestApp } from '@nocobase/app-testing/server';
import { signIn } from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { userManagementServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import {
  createAgents,
  AGENTS_MIGRATIONS,
  AGENTS_PACKAGE,
} from '@nocobase/app-plugin-agents/testing';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
} from '@nocobase/app-server/router';
import { createSecretsService } from '@nocobase/app-server/secrets';
import { databaseManagerToken } from '@nocobase/db';
import { expect, it } from 'vitest';

import { createStandaloneServer } from '../helpers/minimal-app.js';

it('saves encrypted real connections through both permission boundaries while preserving keys, models and defaults', async () => {
  const app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { enabled: true } },
  });
  try {
    const container = app.application.container;
    const database = container.resolve(databaseManagerToken);
    await database
      .createMigrator({
        packageName: AGENTS_PACKAGE,
        directory: AGENTS_MIGRATIONS,
      })
      .latest();
    const agents = createAgents({
      database,
      idGenerator: { generateString: randomUUID },
      secrets: createSecretsService({
        keys: [{ version: 1, key: 'a'.repeat(64) }],
      }),
    });
    container.instance(agentsToken, agents);
    const authz = container.resolve(authorizationToken);
    authz.settings.add({
      id: 'agents.services',
      title: 'Models',
      actions: [
        { name: 'read', title: 'Read' },
        { name: 'manage', title: 'Manage' },
      ],
    });
    const users = container.resolve(userManagementServiceToken);
    const session = async (
      name: string,
      demoActions: string[],
      modelActions: string[],
    ) => {
      await authz.permissionSets.create({
        key: name,
        grants: [
          {
            resource: { type: 'settings', id: 'demoMode.configuration' },
            actions: demoActions.map((action) => ({ action })),
          },
          {
            resource: { type: 'settings', id: 'agents.services' },
            actions: modelActions.map((action) => ({ action })),
          },
        ],
      });
      await users.create({
        username: name,
        name,
        email: `${name}@example.com`,
        password: 'Model123!',
        roleScopes: { app: [name] },
      });
      return signIn(app, {
        email: `${name}@example.com`,
        password: 'Model123!',
      });
    };
    const manager = await session(
      'model_manager',
      ['read', 'configure'],
      ['read', 'manage'],
    );
    const demoOnly = await session(
      'demo_only',
      ['read', 'configure'],
      ['read'],
    );
    const modelsOnly = await session(
      'models_only',
      ['read'],
      ['read', 'manage'],
    );
    const document = await (await manager.fetch('/swagger')).json();
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    expect(
      findUndeclaredApiRoutes(app.application.apiRouter!).filter((route) =>
        route.path.includes('/demoMode'),
      ),
    ).toEqual([]);
    expect(JSON.stringify(document)).toContain('demoModeSaveModelConnection');
    const path = '/demoMode/configuration/modelServices';
    const input = {
      service: null,
      baseUrl: 'https://models.example.com/v1',
      apiKey: 'test-private-api-key',
      model: 'chat-v1',
    };
    const post = (body: object) => ({
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    expect((await app.request(path, post(input))).status).toBe(401);
    expect((await demoOnly.fetch(path, post(input))).status).toBe(403);
    expect((await modelsOnly.fetch(path, post(input))).status).toBe(403);
    expect(await agents.models.services.list()).toEqual([]);
    const primary = await agents.models.services.create({
      title: 'Primary',
      provider: 'openai-compatible',
      baseUrl: 'https://primary.example.com/v1',
      models: [{ value: 'primary-chat' }],
    });
    const defaults = await agents.models.services.defaults();
    const response = await manager.fetch(path, post(input));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      baseUrl: input.baseUrl,
      apiKeySet: true,
    });
    expect(JSON.stringify(body)).not.toContain(input.apiKey);
    const name = body.data.name;
    const stored = () =>
      app.connection.query
        .selectFrom('agModelServices')
        .selectAll()
        .where('name', '=', name)
        .executeTakeFirstOrThrow();
    const encrypted = (await stored()).apiKeyEncrypted;
    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toContain(input.apiKey);
    const update = {
      service: name,
      baseUrl: 'https://other.example.com/v1',
      model: 'chat-v2',
    };
    expect((await manager.fetch(path, post(update))).status).toBe(200);
    expect((await stored()).apiKeyEncrypted).toBe(encrypted);
    expect(
      (await agents.models.services.list())
        .find((item) => item.name === name)
        ?.models.map((item) => item.value),
    ).toEqual(['chat-v1', 'chat-v2']);
    expect(
      (await manager.fetch(path, post({ ...update, apiKey: null }))).status,
    ).toBe(200);
    expect((await stored()).apiKeyEncrypted).toBeNull();
    expect(await agents.models.services.defaults()).toEqual(defaults);
    expect(
      (await agents.models.services.list()).find(
        (item) => item.name === primary.name,
      )?.baseUrl,
    ).toBe('https://primary.example.com/v1');
    expect(
      (
        await manager.fetch(
          path,
          post({ ...update, baseUrl: 'https://user:secret@example.com/v1' }),
        )
      ).status,
    ).toBe(400);
    // The managed simulated endpoint is not an editable real service.
    await app.connection.query
      .insertInto('demoModeModel')
      .values({
        id: 'default',
        modelKey: 'local-secret',
        modelService: primary.name,
      })
      .execute();
    expect(
      (await (await manager.fetch(path)).json()).data.map(
        (item: { name: string }) => item.name,
      ),
    ).toEqual([name]);
    expect(
      (await manager.fetch(path, post({ ...update, service: primary.name })))
        .status,
    ).toBe(404);
    const configuration = await (
      await manager.fetch('/demoMode/configuration')
    ).json();
    expect(configuration.data.chat.model).toBeNull();
    expect(JSON.stringify(configuration)).not.toContain(input.apiKey);
  } finally {
    await app.close();
  }
});
