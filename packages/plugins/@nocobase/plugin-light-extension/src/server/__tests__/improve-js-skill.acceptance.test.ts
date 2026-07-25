/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeLightExtensionSettings, setLightExtensionTopLevelSetting } from '@nocobase/runjs/settings';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { relocateRunJSWorkspace } from '../services/MoveSourceService';
import { buildApplicationDefaultLightExtensionIdentity } from '../services/LightExtensionRepoService';
import PluginLightExtensionServer from '../plugin';
import {
  createFlowSurfacesContractContext,
  destroyFlowSurfacesContractContext,
  type FlowSurfacesContractContext,
} from '../../../../plugin-flow-engine/src/server/__tests__/flow-surfaces.contract.helpers';
import {
  FLOW_SURFACES_TEST_PLUGIN_INSTALLS,
  FLOW_SURFACES_TEST_PLUGINS,
} from '../../../../plugin-flow-engine/src/server/__tests__/flow-surfaces.test-plugins';

interface OpenedRunJSFile {
  path: string;
  content: string;
  language?: string;
  blobHash: string;
  size: number;
  managed: boolean;
}

interface RunJSLocator {
  kind: 'flowModel.step';
  modelUid: string;
  flowKey: string;
  stepKey: string;
  paramPath: string[];
}

interface OpenedRunJSWorkspace {
  files: OpenedRunJSFile[];
  locator: RunJSLocator;
  ownerFingerprint: string;
  repository: {
    id?: string;
    repoId?: string;
    headCommitId: string | null;
  };
  settingsDescriptor: {
    descriptorPath: string;
    diagnostics: Array<{ severity?: string }>;
  };
}

// Deleted distributed matrix row -> executable owner:
// authoritative row list -> deleted because enumerating scenario IDs does not execute behavior.
// 01 -> the public Host/runJSSources integration below.
// 02 -> the public Host/runJSSources integration below, plus existing flow-surfaces contract coverage.
// 03 -> the public Host/runJSSources integration below, plus existing flow-surfaces idempotency coverage.
// 04 -> save-source-runtime and move-source compile rollback coverage.
// 05 -> RunJSStudioProvider stale-Head recovery coverage.
// 06 -> JSPageSource and SettingsResolverService settings coverage.
// 07 -> the public moveSource resource contract below, plus move-source and JSPageSource coverage.
// 08 -> file-service, raw-resource-bypass, and move-source authorization/validation coverage.
// 09 -> save-source-runtime entry identity and move-to-inline-service reverse migration coverage.
// 10 -> flow-surfaces JS Page capability coverage.
// 11 -> flow-surfaces bootstrap rollback and move-source transaction coverage.
// 12 -> the external skills docs-consistency suite; it is no longer a Vitest repository-sibling precondition.
// Per-row command/test-name string checks -> deleted because they do not execute the mapped behavior.

describe('Improve JS skill acceptance contract', () => {
  it('keeps a complete JS Page workspace inline until explicit relocation', () => {
    const relocated = relocateRunJSWorkspace({
      kind: 'js-page',
      entryName: 'sales-overview',
      entryTitle: 'Sales overview',
      entryPath: 'src/client/index.tsx',
      files: [
        {
          path: 'src/client/index.tsx',
          content: "import { Summary } from './components/Summary';\nctx.render(<Summary />);\n",
        },
        {
          path: 'src/client/components/Summary.tsx',
          content: 'export const Summary = () => <div />;\n',
        },
        {
          path: 'src/client/entry.json',
          content: JSON.stringify({
            schemaVersion: 1,
            key: 'stable-sales-page',
            settings: {
              title: { type: 'string', default: 'Sales' },
              compact: { type: 'boolean', default: false },
            },
          }),
        },
        {
          path: '.nocobase/runjs-source.json',
          content: JSON.stringify({ schemaVersion: 1, entry: 'src/client/index.tsx' }),
        },
      ],
    });

    expect(relocated).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'src/client/js-pages/sales-overview/components/Summary.tsx' }),
        expect.objectContaining({ path: 'src/client/js-pages/sales-overview/entry.json' }),
        expect.objectContaining({ path: 'src/client/js-pages/sales-overview/index.tsx' }),
      ]),
    );
    expect(relocated.some((file) => file.path.includes('.nocobase'))).toBe(false);
    expect(relocated.find((file) => file.path.endsWith('/index.tsx'))?.content).toContain(
      "from './components/Summary'",
    );
    expect(JSON.parse(relocated.find((file) => file.path.endsWith('/entry.json'))?.content || '{}')).toMatchObject({
      key: 'stable-sales-page',
      settings: {
        title: { type: 'string', default: 'Sales' },
        compact: { type: 'boolean', default: false },
      },
    });
  });

  it('keeps application default repository identity stable and application-scoped', () => {
    const first = buildApplicationDefaultLightExtensionIdentity('sales-app');
    expect(buildApplicationDefaultLightExtensionIdentity('sales-app')).toEqual(first);
    expect(buildApplicationDefaultLightExtensionIdentity('support-app').repoId).not.toBe(first.repoId);
  });

  it('keeps descriptor defaults, falsy Host overrides, and default restoration equivalent', () => {
    const descriptor = {
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string', default: 'Sales' },
          compact: { type: 'boolean', default: true },
          limit: { type: 'number', default: 20 },
        },
      },
      defaults: { title: 'Sales', compact: true, limit: 20 },
    };
    const overrides = { title: '', compact: false, limit: 0 };

    expect(normalizeLightExtensionSettings(descriptor, overrides)).toEqual(overrides);
    expect(
      normalizeLightExtensionSettings(descriptor, setLightExtensionTopLevelSetting(overrides, 'limit', undefined)),
    ).toEqual({ title: '', compact: false, limit: 20 });
  });

  it('rejects path traversal before an externalization write can start', () => {
    expect(() =>
      relocateRunJSWorkspace({
        kind: 'js-block',
        entryName: 'unsafe-entry',
        entryPath: 'src/client/index.tsx',
        files: [
          { path: 'src/client/index.tsx', content: 'ctx.render(null);' },
          { path: '../server/unsafe.ts', content: 'export default {};' },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: 'LIGHT_EXTENSION_INVALID_INPUT' }));
  });
});

describe('Improve JS skill public Host and Workspace acceptance', () => {
  let context: FlowSurfacesContractContext;

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext({
      enabledPluginAliases: [...FLOW_SURFACES_TEST_PLUGINS, 'light-extension'],
      plugins: [...FLOW_SURFACES_TEST_PLUGIN_INSTALLS, PluginLightExtensionServer],
    });
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('uses public Host and incremental runJSSources actions for default Inline JS Block and JS Page workspaces', async () => {
    const { app, rootAgent: agent } = context;
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ordinaryPageResponse = await agent.resource('flowSurfaces').createPage({
      values: {
        title: `Inline JS Block page ${suffix}`,
        tabTitle: 'Main',
        icon: 'FileOutlined',
      },
    });
    expect(ordinaryPageResponse.status).toBe(200);
    const ordinaryPage = ordinaryPageResponse.body.data;
    const blockResponse = await agent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: ordinaryPage.tabSchemaUid },
        type: 'jsBlock',
        settings: { title: 'Inline block', code: 'ctx.render(null);' },
      },
    });
    expect(blockResponse.status).toBe(200);
    expect(blockResponse.body.data).toMatchObject({
      workspaceStatus: 'ready',
      runJSLocator: { kind: 'flowModel.step' },
    });

    const idempotencyKey = `create-js-page-${suffix}`;
    const pageValues = {
      pageType: 'js-page',
      idempotencyKey,
      title: `Inline JS Page ${suffix}`,
      icon: 'CodeOutlined',
    };
    const pageResponse = await agent.resource('flowSurfaces').createPage({ values: pageValues });
    expect(pageResponse.status).toBe(200);
    expect(pageResponse.body.data).toMatchObject({
      pageType: 'js-page',
      workspaceStatus: 'ready',
      runJSLocator: { kind: 'flowModel.step' },
    });
    const page = pageResponse.body.data;

    const surfaces = [
      {
        key: 'js-block',
        label: 'JS Block',
        hostUid: blockResponse.body.data.uid as string,
        locator: blockResponse.body.data.runJSLocator as RunJSLocator,
      },
      {
        key: 'js-page',
        label: 'JS Page',
        hostUid: page.pageUid as string,
        locator: page.runJSLocator as RunJSLocator,
      },
    ];

    for (const surface of surfaces) {
      const openedResponse = await agent.resource('runJSSources').open({ values: { locator: surface.locator } });
      expect(openedResponse.status).toBe(200);
      const opened = openedResponse.body.data as OpenedRunJSWorkspace;
      expect(opened.locator).toEqual(surface.locator);
      expect(opened.settingsDescriptor).toMatchObject({
        descriptorPath: 'src/client/entry.json',
        diagnostics: [],
      });
      expect(opened.files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'src/client/index.tsx',
            blobHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
            managed: false,
          }),
          expect.objectContaining({
            path: 'src/client/entry.json',
            blobHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
            managed: false,
          }),
          expect.objectContaining({
            path: '.nocobase/runjs-source.json',
            blobHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
            managed: true,
          }),
        ]),
      );
      for (const file of opened.files) {
        expect(file.size).toBe(Buffer.byteLength(file.content, 'utf8'));
      }

      const repoId = opened.repository.repoId || opened.repository.id;
      if (!repoId) {
        throw new Error(`${surface.label} Workspace did not expose a repository id`);
      }
      const openedIndex = requireOpenedFile(opened.files, 'src/client/index.tsx');
      const openedEntry = requireOpenedFile(opened.files, 'src/client/entry.json');
      const componentPath = 'src/client/components/SurfaceView.tsx';
      const unusedPath = 'src/client/components/Unused.ts';
      const initialIndex = "import { SurfaceView } from './components/SurfaceView';\nctx.render(<SurfaceView />);\n";
      const descriptor = `${JSON.stringify(
        {
          schemaVersion: 1,
          key: `agent-p0-${surface.key}`,
          settings: {
            title: { type: 'string', default: surface.label },
            enabled: { type: 'boolean', default: false },
            count: { type: 'integer', default: 0 },
          },
        },
        null,
        2,
      )}\n`;
      const firstChanges = [
        {
          operation: 'upsert',
          path: openedIndex.path,
          expectedBlobHash: openedIndex.blobHash,
          content: initialIndex,
        },
        {
          operation: 'upsert',
          path: openedEntry.path,
          expectedBlobHash: openedEntry.blobHash,
          content: descriptor,
        },
        {
          operation: 'upsert',
          path: componentPath,
          expectedBlobHash: null,
          content: `export const SurfaceView = () => <div>${surface.label} v1</div>;\n`,
        },
        {
          operation: 'upsert',
          path: unusedPath,
          expectedBlobHash: null,
          content: 'export const unused = true;\n',
        },
      ] as const;
      const firstSave = await agent.resource('runJSSources').saveChanges({
        values: {
          locator: surface.locator,
          repoId,
          baseCommitId: opened.repository.headCommitId,
          baseOwnerFingerprint: opened.ownerFingerprint,
          message: `Create complete ${surface.label} Workspace`,
          changes: firstChanges,
          entryPath: 'src/client/index.tsx',
          version: 'v2',
        },
      });
      expect(firstSave.status).toBe(200);
      expect(firstSave.body.data).toMatchObject({
        repository: { headCommitId: firstSave.body.data.commit.id },
        artifact: {
          entryPath: 'src/client/index.tsx',
          filesHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
          runtimeCodeHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
          diagnostics: [],
        },
        ownerFingerprint: expect.any(String),
      });

      const afterFirstResponse = await agent.resource('runJSSources').openLatest({
        values: { locator: surface.locator },
      });
      expect(afterFirstResponse.status).toBe(200);
      const afterFirst = afterFirstResponse.body.data as OpenedRunJSWorkspace;
      const firstIndex = requireOpenedFile(afterFirst.files, openedIndex.path);
      const firstEntry = requireOpenedFile(afterFirst.files, openedEntry.path);
      const firstComponent = requireOpenedFile(afterFirst.files, componentPath);
      const firstUnused = requireOpenedFile(afterFirst.files, unusedPath);

      const secondChanges = [
        {
          operation: 'upsert',
          path: firstComponent.path,
          expectedBlobHash: firstComponent.blobHash,
          content: `export const SurfaceView = () => <div>${surface.label} v2</div>;\n`,
        },
      ] as const;
      expect(secondChanges).toHaveLength(1);
      expect(secondChanges.map((change) => change.path)).toEqual([componentPath]);
      const secondSave = await agent.resource('runJSSources').saveChanges({
        values: {
          locator: surface.locator,
          repoId,
          baseCommitId: afterFirst.repository.headCommitId,
          baseOwnerFingerprint: afterFirst.ownerFingerprint,
          message: `Update one ${surface.label} component`,
          changes: secondChanges,
        },
      });
      expect(secondSave.status).toBe(200);

      const afterSecondResponse = await agent.resource('runJSSources').openLatest({
        values: { locator: surface.locator },
      });
      expect(afterSecondResponse.status).toBe(200);
      const afterSecond = afterSecondResponse.body.data as OpenedRunJSWorkspace;
      expect(requireOpenedFile(afterSecond.files, firstIndex.path)).toMatchObject({
        content: firstIndex.content,
        blobHash: firstIndex.blobHash,
      });
      expect(requireOpenedFile(afterSecond.files, firstEntry.path)).toMatchObject({
        content: firstEntry.content,
        blobHash: firstEntry.blobHash,
      });
      expect(requireOpenedFile(afterSecond.files, firstUnused.path)).toMatchObject({
        content: firstUnused.content,
        blobHash: firstUnused.blobHash,
      });
      expect(requireOpenedFile(afterSecond.files, componentPath).content).toContain(`${surface.label} v2`);
      expect(readRunJSManifest(afterSecond.files)).toMatchObject({
        entry: 'src/client/index.tsx',
        runtimeVersion: 'v2',
      });

      const deleted = await agent.resource('runJSSources').saveChanges({
        values: {
          locator: surface.locator,
          repoId,
          baseCommitId: afterSecond.repository.headCommitId,
          baseOwnerFingerprint: afterSecond.ownerFingerprint,
          message: `Delete unused ${surface.label} file`,
          changes: [
            {
              operation: 'delete',
              path: unusedPath,
              expectedBlobHash: requireOpenedFile(afterSecond.files, unusedPath).blobHash,
            },
          ],
        },
      });
      expect(deleted.status).toBe(200);

      const stableResponse = await agent.resource('runJSSources').openLatest({
        values: { locator: surface.locator },
      });
      expect(stableResponse.status).toBe(200);
      const stable = stableResponse.body.data as OpenedRunJSWorkspace;
      expect(stable.files.map((file) => file.path)).not.toContain(unusedPath);
      const stableComponent = requireOpenedFile(stable.files, componentPath);
      const stableIndex = requireOpenedFile(stable.files, openedIndex.path);
      const historyBeforeFailure = await agent.resource('runJSSources').listHistory({
        values: { locator: surface.locator, repoId, limit: 1 },
      });
      expect(historyBeforeFailure.status).toBe(200);
      expect(historyBeforeFailure.body.data.items[0]).toMatchObject({
        id: deleted.body.data.commit.id,
        metadata: {
          filesHash: deleted.body.data.artifact.filesHash,
          runtimeCodeHash: deleted.body.data.artifact.runtimeCodeHash,
        },
      });
      const hostBeforeFailureResponse = await agent.resource('flowSurfaces').get({ uid: surface.hostUid });
      expect(hostBeforeFailureResponse.status).toBe(200);
      const hostRuntimeBeforeFailure = hostBeforeFailureResponse.body.data.tree.stepParams as unknown;

      const conflicted = await agent.resource('runJSSources').saveChanges({
        values: {
          locator: surface.locator,
          repoId,
          baseCommitId: stable.repository.headCommitId,
          baseOwnerFingerprint: stable.ownerFingerprint,
          message: `Reject stale ${surface.label} file`,
          changes: [
            {
              operation: 'upsert',
              path: componentPath,
              expectedBlobHash: '0'.repeat(64),
              content: `export const SurfaceView = () => <div>${surface.label} conflict</div>;\n`,
            },
          ],
        },
      });
      expect(conflicted.status).toBe(409);
      expect(conflicted.body.errors[0]).toMatchObject({
        code: 'RUNJS_FILE_CONFLICT',
        details: {
          path: componentPath,
          expectedBlobHash: '0'.repeat(64),
          currentBlobHash: stableComponent.blobHash,
        },
      });
      await expectWorkspaceAndHostUnchanged({
        agent,
        hostUid: surface.hostUid,
        locator: surface.locator,
        repoId,
        stable,
        historyItem: historyBeforeFailure.body.data.items[0] as unknown,
        hostRuntime: hostRuntimeBeforeFailure,
      });

      const compileFailure = await agent.resource('runJSSources').saveChanges({
        values: {
          locator: surface.locator,
          repoId,
          baseCommitId: stable.repository.headCommitId,
          baseOwnerFingerprint: stable.ownerFingerprint,
          message: `Reject invalid ${surface.label} import`,
          changes: [
            {
              operation: 'upsert',
              path: stableIndex.path,
              expectedBlobHash: stableIndex.blobHash,
              content: "import { missing } from './components/Missing';\nctx.render(missing);\n",
            },
          ],
        },
      });
      expect(compileFailure.status).toBe(400);
      expect(compileFailure.body.errors[0]).toMatchObject({ code: 'RUNJS_IMPORT_NOT_FOUND' });
      await expectWorkspaceAndHostUnchanged({
        agent,
        hostUid: surface.hostUid,
        locator: surface.locator,
        repoId,
        stable,
        historyItem: historyBeforeFailure.body.data.items[0] as unknown,
        hostRuntime: hostRuntimeBeforeFailure,
      });
    }

    const replay = await agent.resource('flowSurfaces').createPage({ values: pageValues });
    expect(replay.status).toBe(200);
    expect(replay.body.data).toMatchObject({
      pageUid: page.pageUid,
      pageSchemaUid: page.pageSchemaUid,
      idempotentReplay: true,
    });
    expect(await app.db.getRepository('lightExtensionRepos').count()).toBe(0);
  }, 240000);
});

function requireOpenedFile(files: OpenedRunJSFile[], path: string): OpenedRunJSFile {
  const file = files.find((item) => item.path === path);
  if (!file) {
    throw new Error(`RunJS Workspace file not found: ${path}`);
  }
  return file;
}

function readRunJSManifest(files: OpenedRunJSFile[]): Record<string, unknown> {
  const manifest = requireOpenedFile(files, '.nocobase/runjs-source.json');
  expect(manifest.managed).toBe(true);
  return JSON.parse(manifest.content) as Record<string, unknown>;
}

async function expectWorkspaceAndHostUnchanged(input: {
  agent: FlowSurfacesContractContext['rootAgent'];
  hostUid: string;
  locator: RunJSLocator;
  repoId: string;
  stable: OpenedRunJSWorkspace;
  historyItem: unknown;
  hostRuntime: unknown;
}) {
  const latestResponse = await input.agent.resource('runJSSources').openLatest({
    values: { locator: input.locator },
  });
  expect(latestResponse.status).toBe(200);
  const latest = latestResponse.body.data as OpenedRunJSWorkspace;
  expect(latest.repository.headCommitId).toBe(input.stable.repository.headCommitId);
  expect(latest.ownerFingerprint).toBe(input.stable.ownerFingerprint);
  expect(latest.files).toEqual(input.stable.files);

  const historyResponse = await input.agent.resource('runJSSources').listHistory({
    values: { locator: input.locator, repoId: input.repoId, limit: 1 },
  });
  expect(historyResponse.status).toBe(200);
  expect(historyResponse.body.data.items[0]).toEqual(input.historyItem);

  const hostResponse = await input.agent.resource('flowSurfaces').get({ uid: input.hostUid });
  expect(hostResponse.status).toBe(200);
  expect(hostResponse.body.data.tree.stepParams).toEqual(input.hostRuntime);
}
