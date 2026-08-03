/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';

import PluginLightExtensionServer from '../plugin';

interface ApiResponse {
  status: number;
  body: unknown;
}

type TestAgent = ReturnType<MockServer['agent']>;

const repoId = 'ler_js_template_alias';
const entryId = 'lee_js_template_alias';
const headCommitId = 'vscc_js_template_alias';
const artifactHash = 'a'.repeat(64);
const runtimeCodeHash = 'runtime-code-hash';

describe('JS Template HTTP aliases', () => {
  let app: MockServer;
  let rootAgent: TestAgent;

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
    rootAgent = await app.agent().login(await app.db.getRepository('users').findOne());
    await seedDomainRecords();
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('returns identical happy-path responses for every public resource family', async () => {
    const cases = [
      ['lightExtensionCapabilities', 'jsTemplateCapabilities', 'get', undefined],
      ['lightExtensionRepos', 'jsTemplateRepos', 'list', undefined],
      ['lightExtensionRepos', 'jsTemplateRepos', 'get', { repoId }],
      ['lightExtensionEntries', 'jsTemplateEntries', 'list', { repoId }],
      ['lightExtensionReferences', 'jsTemplateReferences', 'readReferences', { repoId }],
      [
        'lightExtensionRuntime',
        'jsTemplateRuntime',
        'resolve',
        {
          sourceMode: 'light-extension',
          sourceBinding: {
            type: 'light-extension-entry',
            repoId,
            entryId,
            kind: 'js-block',
          },
          settings: {},
        },
      ],
      ['lightExtensionRuntime', 'jsTemplateRuntime', 'getArtifact', { artifactHash }],
      ['lightExtensionSync', 'jsTemplateSync', 'get', { repoId }],
      ['lightExtensionCreateJobs', 'jsTemplateCreateJobs', 'list', undefined],
    ] as const;

    for (const [legacyResource, canonicalResource, action, values] of cases) {
      const legacy = await callResource(rootAgent, legacyResource, action, values);
      const canonical = await callResource(rootAgent, canonicalResource, action, values);
      expect(canonical.status, `${canonicalResource}:${action}`).toBe(legacy.status);
      expect(canonical.body, `${canonicalResource}:${action}`).toEqual(legacy.body);
    }
  });

  it('keeps CRUD updates on one implementation and preserves legacy error contracts for check, save, move, and runtime', async () => {
    const updateValues = { repoId, title: 'Canonical title', description: 'Shared implementation' };
    const legacyUpdate = await callResource(rootAgent, 'lightExtensionRepos', 'updateMetadata', updateValues);
    const canonicalUpdate = await callResource(rootAgent, 'jsTemplateRepos', 'updateMetadata', updateValues);
    expect(canonicalUpdate.status).toBe(legacyUpdate.status);
    expect(canonicalUpdate.body).toEqual(legacyUpdate.body);
    expect(canonicalUpdate.status).toBe(200);

    const failures = [
      ['lightExtensionRepos', 'jsTemplateRepos', 'inspectSourceArchive', { repoId, zipBase64: 'not-a-zip' }],
      ['lightExtensionFiles', 'jsTemplateFiles', 'saveSource', {}],
      ['lightExtensions', 'jsTemplates', 'compileWorkspacePreview', { repoId, files: [] }],
      [
        'lightExtensions',
        'jsTemplates',
        'moveSource',
        {
          locator: {
            kind: 'flowModel.step',
            modelUid: 'fm_js_template_alias',
            flowKey: 'jsSettings',
            stepKey: 'runJs',
            paramPath: ['code'],
          },
        },
      ],
      ['lightExtensionRuntime', 'jsTemplateRuntime', 'getArtifact', { artifactHash: 'b'.repeat(64) }],
    ] as const;

    for (const [legacyResource, canonicalResource, action, values] of failures) {
      const legacy = await callResource(rootAgent, legacyResource, action, values);
      const canonical = await callResource(rootAgent, canonicalResource, action, values);
      expect(canonical.status, `${canonicalResource}:${action}`).toBe(legacy.status);
      expect(canonical.body, `${canonicalResource}:${action}`).toEqual(legacy.body);
      expect(canonical.status).toBeGreaterThanOrEqual(400);
      expect(JSON.stringify(canonical.body)).toContain('LIGHT_EXTENSION_');
    }
  });

  it('uses existing legacy grants for canonical APIs without granting additional canonical resources', async () => {
    const roleName = 'jsTemplateLegacyGrant';
    await app.db.getRepository('roles').create({ values: { name: roleName } });
    const user = await app.db.getRepository('users').create({
      values: { nickname: roleName, roles: [roleName] },
    });
    await rootAgent.resource('roles.resources', roleName).create({
      values: {
        name: 'lightExtensionRepos',
        usingActionsConfig: true,
        actions: [{ name: 'list' }],
      },
    });
    const restrictedAgent = (await app.agent().login(user)).set('x-role', roleName);

    const legacyAllowed = await callResource(restrictedAgent, 'lightExtensionRepos', 'list');
    const canonicalAllowed = await callResource(restrictedAgent, 'jsTemplateRepos', 'list');
    expect(canonicalAllowed.status).toBe(legacyAllowed.status);
    expect(canonicalAllowed.body).toEqual(legacyAllowed.body);
    expect(canonicalAllowed.status).toBe(200);

    const legacyDenied = await callResource(restrictedAgent, 'lightExtensionRepos', 'get', { repoId });
    const canonicalDenied = await callResource(restrictedAgent, 'jsTemplateRepos', 'get', { repoId });
    expect(canonicalDenied.status).toBe(legacyDenied.status);
    expect(canonicalDenied.body).toEqual(legacyDenied.body);
    expect(canonicalDenied.status).toBe(403);

    const legacyFileDenied = await callResource(restrictedAgent, 'lightExtensionFiles', 'getFile', {
      repoId,
      path: 'src/client/js-blocks/alias/index.tsx',
    });
    const canonicalFileDenied = await callResource(restrictedAgent, 'jsTemplateFiles', 'getFile', {
      repoId,
      path: 'src/client/js-blocks/alias/index.tsx',
    });
    expect(canonicalFileDenied.status).toBe(legacyFileDenied.status);
    expect(canonicalFileDenied.body).toEqual(legacyFileDenied.body);
    expect(canonicalFileDenied.status).toBe(403);
    expect(
      await app.db.getRepository('rolesResources').count({
        filter: { roleName, name: { $like: 'jsTemplate%' } },
      }),
    ).toBe(0);
  });

  it('returns the same legacy unavailable error after the plugin is disabled', async () => {
    const plugin = app.pm.get(PluginLightExtensionServer) as PluginLightExtensionServer;
    await plugin.afterDisable();

    for (const [legacyResource, canonicalResource, action] of [
      ['lightExtensionRepos', 'jsTemplateRepos', 'list'],
      ['lightExtensionCreateJobs', 'jsTemplateCreateJobs', 'list'],
    ] as const) {
      const legacy = await callResource(rootAgent, legacyResource, action);
      const canonical = await callResource(rootAgent, canonicalResource, action);
      expect(canonical.status, `${canonicalResource}:${action}`).toBe(legacy.status);
      expect(canonical.body, `${canonicalResource}:${action}`).toEqual(legacy.body);
      expect(canonical.status).toBe(503);
      expect(JSON.stringify(canonical.body)).toContain('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE');
    }
  });

  async function seedDomainRecords(): Promise<void> {
    await app.db.getRepository('lightExtensionRepos').create({
      values: {
        id: repoId,
        vscRepoId: 'vscr_js_template_alias',
        applicationName: app.name,
        name: 'js-template-alias',
        normalizedName: 'js-template-alias',
        title: 'JS Template alias',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId,
      },
    });
    await app.db.getRepository('lightExtensionEntries').create({
      values: {
        id: entryId,
        repoId,
        target: 'client',
        kind: 'js-block',
        entryName: 'alias',
        entryPath: 'src/client/js-blocks/alias/index.tsx',
        descriptorPath: 'src/client/js-blocks/alias/entry.json',
        settingsSchema: null,
        settingsSchemaHash: null,
        settingsDefaultsHash: null,
        compiledCommitId: headCommitId,
        runtimeVersion: 'v2',
        surfaceStyle: 'render',
        runtimeCodeHash,
        artifactHash,
        filesHash: 'files-hash',
        healthStatus: 'ready',
        diagnostics: [],
      },
    });
    await app.db.getRepository('lightExtensionRuntimeArtifacts').create({
      values: {
        artifactHash,
        runtimeCodeHash,
        code: 'ctx.render("JS Template alias");',
        sourceMap: null,
        version: 'v2',
        entryPath: 'src/client/js-blocks/alias/index.tsx',
        runtimeContract: 'light-extension.runtime-artifact.v1',
        byteSize: 32,
      },
    });
  }
});

async function callResource(
  agent: TestAgent,
  resourceName: string,
  actionName: string,
  values?: Readonly<Record<string, unknown>>,
): Promise<ApiResponse> {
  const resource = agent.resource(resourceName) as unknown as Record<
    string,
    (options?: { values?: Readonly<Record<string, unknown>> }) => Promise<ApiResponse>
  >;
  return resource[actionName](typeof values === 'undefined' ? undefined : { values });
}
