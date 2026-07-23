/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeLightExtensionSettings, setLightExtensionTopLevelSetting } from '@nocobase/runjs/settings';
import type { Context } from 'koa';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { LightExtensionCompilePreviewService } from '../services/LightExtensionCompilePreviewService';
import { relocateRunJSWorkspace } from '../services/MoveSourceService';
import { buildApplicationDefaultLightExtensionIdentity } from '../services/LightExtensionRepoService';
import type { MoveSourceService } from '../services/MoveSourceService';
import PluginLightExtensionServer from '../plugin';
import { createLightExtensionsResource } from '../resources/lightExtensions';
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
  content?: string;
  language?: string;
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

  it('normalizes explicit externalization through the public lightExtensions resource', async () => {
    const moveSource = vi.fn(async () => ({ repo: { id: 'ler_default' }, ownerFingerprint: 'owner_after' }));
    const resource = createLightExtensionsResource(
      {} as LightExtensionCompilePreviewService,
      {
        moveSource,
      } as unknown as MoveSourceService,
    );
    const can = vi.fn().mockReturnValue({});
    const ctx = {
      action: {
        params: {
          values: {
            idempotencyKey: 'externalize-sales-page-v1',
            locator: {
              kind: 'flowModel.step',
              modelUid: 'sales-page',
              flowKey: 'jsSettings',
              stepKey: 'runJs',
              paramPath: ['code'],
            },
            expectedOwnerFingerprint: 'owner_before',
            sourceRepoId: 'runjs_sales_page',
            sourceHeadCommitId: 'commit_inline',
            entryPath: 'src/client/index.tsx',
            version: 'v2',
            files: [{ path: 'src/client/index.tsx', content: 'ctx.render(null);' }],
            destination: { type: 'default' },
            entryName: 'sales-page',
          },
        },
      },
      auth: { user: { id: 9 } },
      can,
      request: { headers: { 'x-request-id': 'req_externalize', 'x-request-source': 'acceptance-matrix' } },
    } as unknown as Context;

    await resource.actions?.moveSource?.(ctx, async () => undefined);

    expect(moveSource).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'externalize-sales-page-v1',
        destination: { type: 'default' },
        entryName: 'sales-page',
        files: [
          expect.objectContaining({
            path: 'src/client/index.tsx',
            content: 'ctx.render(null);',
          }),
        ],
      }),
      expect.objectContaining({
        actorUserId: '9',
        requestId: 'req_externalize',
        requestSource: 'acceptance-matrix',
        can,
      }),
    );
    expect((ctx as { body?: unknown }).body).toEqual({
      repo: { id: 'ler_default' },
      ownerFingerprint: 'owner_after',
    });
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

  it('uses public Host and runJSSources actions for default Inline JS Block and JS Page workspaces', async () => {
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
    const openedBlock = await agent.resource('runJSSources').open({
      values: { locator: blockResponse.body.data.runJSLocator },
    });
    expect(openedBlock.status).toBe(200);
    expect(openedBlock.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'src/client/index.tsx' }),
        expect.objectContaining({ path: 'src/client/entry.json' }),
        expect.objectContaining({ path: '.nocobase/runjs-source.json' }),
      ]),
    );
    expect(await app.db.getRepository('lightExtensionRepos').count()).toBe(0);

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
    const openedPage = await agent.resource('runJSSources').open({ values: { locator: page.runJSLocator } });
    expect(openedPage.status).toBe(200);
    const openedFiles = openedPage.body.data.files as OpenedRunJSFile[];
    const files = openedFiles.map((file) => ({
      path: file.path,
      content:
        file.path === 'src/client/index.tsx'
          ? "import { Summary } from './components/Summary';\nctx.render(<Summary />);\n"
          : file.content,
      language: file.language,
    }));
    files.push({
      path: 'src/client/components/Summary.tsx',
      content: 'export const Summary = () => <div>Sales summary</div>;\n',
      language: 'typescript',
    });

    const preview = await agent.resource('runJSSources').compilePreview({
      values: {
        locator: page.runJSLocator,
        repoId: openedPage.body.data.repository.repoId,
        baseCommitId: openedPage.body.data.repository.headCommitId,
        files,
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });
    expect(preview.status).toBe(200);
    expect(preview.body.data.artifact.diagnostics).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ severity: 'error' })]),
    );

    const saved = await agent.resource('runJSSources').save({
      values: {
        locator: page.runJSLocator,
        repoId: openedPage.body.data.repository.repoId,
        baseCommitId: openedPage.body.data.repository.headCommitId,
        baseOwnerFingerprint: openedPage.body.data.ownerFingerprint,
        message: 'Save complete JS Page workspace',
        files,
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });
    expect(saved.status).toBe(200);

    const latest = await agent.resource('runJSSources').openLatest({ values: { locator: page.runJSLocator } });
    expect(latest.status).toBe(200);
    expect(latest.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'src/client/components/Summary.tsx' }),
        expect.objectContaining({
          path: 'src/client/index.tsx',
          content: expect.stringContaining('./components/Summary'),
        }),
      ]),
    );

    const replay = await agent.resource('flowSurfaces').createPage({ values: pageValues });
    expect(replay.status).toBe(200);
    expect(replay.body.data).toMatchObject({
      pageUid: page.pageUid,
      pageSchemaUid: page.pageSchemaUid,
      idempotentReplay: true,
    });
    expect(await app.db.getRepository('lightExtensionRepos').count()).toBe(0);
  }, 120000);
});
