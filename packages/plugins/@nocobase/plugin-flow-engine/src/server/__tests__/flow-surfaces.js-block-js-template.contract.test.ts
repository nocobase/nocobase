/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { compileRunJSSourceWorkspace } from '@nocobase/runjs/compiler';
import {
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { collectRunJsAuthoringErrors } from '../flow-surfaces/runjs-authoring/collectors';

const JS_TEMPLATE_SOURCE_BINDING = {
  type: 'js-template-entry',
  projectId: 'jtp_sales',
  templateId: 'jtt_kpi_cards',
  kind: 'js-block',
};

const JS_TEMPLATE_ACTION_SOURCE_BINDING = {
  type: 'js-template-entry',
  projectId: 'jtp_sales',
  templateId: 'jtt_refresh_sales_kpi',
  kind: 'js-action',
};

const LEGACY_SOURCE_REF = {
  type: 'vsc-file',
  path: 'packages/plugins/custom/src/blocks/finance-summary.tsx',
};

function findExportedJsBlock(blocks: Array<Record<string, unknown>>) {
  return blocks.find((item) => item.type === 'jsBlock');
}

describe('flowSurfaces JS block js-template contract', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    rootAgent = context.rootAgent;
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should persist js-template binding and instance settings through addBlock/configure/updateSettings', async () => {
    const page = await createPage(rootAgent, {
      title: 'JS block source page',
      tabTitle: 'Main',
    });

    const block = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'jsBlock',
          settings: {
            title: 'Sales KPI',
            sourceMode: 'js-template',
            sourceBinding: JS_TEMPLATE_SOURCE_BINDING,
            settings: {
              region: 'APAC',
            },
          },
        },
      }),
    );

    let readback = await getSurface(rootAgent, { uid: block.uid });
    expect(readback.tree.stepParams?.jsSettings?.runJs).toMatchObject({
      sourceMode: 'js-template',
      sourceBinding: JS_TEMPLATE_SOURCE_BINDING,
      settings: {
        region: 'APAC',
      },
    });
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceBinding');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('settings');
    expect(readback.tree.stepParams?.jsSettings?.runJs).not.toHaveProperty('sourceRef');

    const nextBinding = {
      ...JS_TEMPLATE_SOURCE_BINDING,
      templateId: 'jtt_sales_kpi_v2',
    };
    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: block.uid,
        },
        changes: {
          sourceMode: 'js-template',
          sourceBinding: nextBinding,
          settings: {
            region: 'EMEA',
            refreshInterval: 60,
          },
          showBlockCard: false,
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    readback = await getSurface(rootAgent, { uid: block.uid });
    expect(readback.tree.stepParams?.jsSettings).toMatchObject({
      runJs: {
        sourceMode: 'js-template',
        sourceBinding: nextBinding,
        settings: {
          region: 'EMEA',
          refreshInterval: 60,
        },
      },
      showBlockCard: {
        showBlockCard: false,
      },
    });
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceBinding');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('settings');

    const legacyMirrorUpdateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: block.uid,
        },
        stepParams: {
          jsSettings: {
            sourceBinding: {
              templateId: 'jtt_sales_kpi_v3',
            },
            settings: {
              currency: 'USD',
            },
          },
        },
      },
    });
    expect(legacyMirrorUpdateRes.status, readErrorMessage(legacyMirrorUpdateRes)).toBe(400);

    const updateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: block.uid,
        },
        stepParams: {
          jsSettings: {
            runJs: {
              sourceBinding: {
                templateId: 'jtt_sales_kpi_v3',
              },
              settings: {
                currency: 'USD',
              },
            },
          },
        },
      },
    });
    expect(updateRes.status, readErrorMessage(updateRes)).toBe(200);

    readback = await getSurface(rootAgent, { uid: block.uid });
    expect(readback.tree.stepParams?.jsSettings?.runJs).toMatchObject({
      sourceMode: 'js-template',
      sourceBinding: {
        ...nextBinding,
        templateId: 'jtt_sales_kpi_v3',
      },
      settings: {
        region: 'EMEA',
        refreshInterval: 60,
        currency: 'USD',
      },
    });
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceBinding');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('settings');
    expect(readback.tree.stepParams?.jsSettings?.runJs?.sourceBinding?.settings).toBeUndefined();
  });

  it('should apply template-backed compose settings before deciding whether to bootstrap a workspace', async () => {
    const page = await createPage(rootAgent, {
      title: 'JS block template compose page',
      tabTitle: 'Main',
    });
    const inlineSource = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.tabSchemaUid },
          type: 'jsBlock',
          settings: { code: "ctx.render('Template inline source');" },
        },
      }),
    );
    const inlineTemplate = getData(
      await rootAgent.resource('flowSurfaces').saveTemplate({
        values: {
          target: { uid: inlineSource.uid },
          name: 'Inline JS block template',
          description: 'Template-backed compose workspace ordering coverage',
          saveMode: 'duplicate',
        },
      }),
    );
    const jsTemplateSource = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.tabSchemaUid },
          type: 'jsBlock',
          settings: {
            sourceMode: 'js-template',
            sourceBinding: JS_TEMPLATE_SOURCE_BINDING,
          },
        },
      }),
    );
    const jsTemplateTemplate = getData(
      await rootAgent.resource('flowSurfaces').saveTemplate({
        values: {
          target: { uid: jsTemplateSource.uid },
          name: 'JS Template JS block template',
          description: 'Template-backed compose source-mode ordering coverage',
          saveMode: 'duplicate',
        },
      }),
    );

    const composeResponse = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.tabSchemaUid },
        blocks: [
          {
            key: 'inlineOverride',
            template: { uid: inlineTemplate.uid, mode: 'copy' },
            settings: { code: "ctx.render('Inline compose override');", sourceMode: 'inline' },
          },
          {
            key: 'externalizedCopy',
            template: { uid: inlineTemplate.uid, mode: 'copy' },
            settings: {
              sourceMode: 'js-template',
              sourceBinding: {
                ...JS_TEMPLATE_SOURCE_BINDING,
                templateId: 'jtt_template_externalized',
              },
            },
          },
          {
            key: 'movedInline',
            template: { uid: jsTemplateTemplate.uid, mode: 'copy' },
            settings: { code: "ctx.render('Moved inline after compose');", sourceMode: 'inline' },
          },
        ],
      },
    });
    expect(composeResponse.status, readErrorMessage(composeResponse)).toBe(200);
    const blocks = getData(composeResponse).blocks as Array<{
      key?: string;
      uid?: string;
      workspaceStatus?: string;
      workspaceRetryable?: boolean;
    }>;
    const inlineOverride = blocks.find((item) => item.key === 'inlineOverride');
    const externalizedCopy = blocks.find((item) => item.key === 'externalizedCopy');
    const movedInline = blocks.find((item) => item.key === 'movedInline');
    expect(inlineOverride).toMatchObject({ workspaceStatus: 'ready', workspaceRetryable: false });
    expect(externalizedCopy).not.toHaveProperty('workspaceStatus');
    expect(movedInline).toMatchObject({ workspaceStatus: 'ready', workspaceRetryable: false });

    for (const [block, expectedSource] of [
      [inlineOverride, "ctx.render('Inline compose override');"],
      [movedInline, "ctx.render('Moved inline after compose');"],
    ] as const) {
      const readback = await getSurface(rootAgent, { uid: block?.uid });
      const locator = readback.tree.runJSLocator;
      const openedResponse = await rootAgent.resource('runJSSources').open({ values: { locator } });
      expect(openedResponse.status, readErrorMessage(openedResponse)).toBe(200);
      const opened = getData(openedResponse);
      expect(opened.files.find((file: { path: string }) => file.path === 'src/client/index.tsx')?.content).toBe(
        expectedSource,
      );
    }

    const externalizedReadback = await getSurface(rootAgent, { uid: externalizedCopy?.uid });
    expect(externalizedReadback.tree.stepParams?.jsSettings?.runJs).toMatchObject({
      sourceMode: 'js-template',
      sourceBinding: {
        templateId: 'jtt_template_externalized',
      },
    });
  });

  it('should export a multi-file workspace runtime artifact as a portable fallback without its sourceRef', async () => {
    const page = await createPage(rootAgent, {
      title: 'JS block export page',
      tabTitle: 'Main',
    });
    const legacyCode = "ctx.render('Legacy inline summary');";

    const composeResponse = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'financeSummary',
            type: 'jsBlock',
            settings: {
              title: 'Finance summary',
              code: legacyCode,
              version: 'v1',
              sourceRef: LEGACY_SOURCE_REF,
            },
          },
        ],
      },
    });
    expect(composeResponse.status, readErrorMessage(composeResponse)).toBe(200);
    const block = getData(composeResponse).blocks.find((item: { key?: string }) => item.key === 'financeSummary');
    expect(block).toMatchObject({
      workspaceStatus: 'ready',
      workspaceRetryable: false,
      runJSLocator: {
        kind: 'flowModel.step',
        flowKey: 'jsSettings',
        stepKey: 'runJs',
        paramPath: ['code'],
      },
    });

    const initialReadback = await getSurface(rootAgent, { uid: block.uid });
    const initialRunJs = initialReadback.tree.stepParams?.jsSettings?.runJs;
    const locator = initialReadback.tree.runJSLocator;
    expect(locator).toMatchObject({
      kind: 'flowModel.step',
      modelUid: block.uid,
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    });
    expect(initialRunJs?.sourceRef).toMatchObject({
      type: 'vsc-file',
      repoId: expect.any(String),
      commitId: expect.any(String),
      entry: 'src/client/index.tsx',
    });

    const openedResponse = await rootAgent.resource('runJSSources').open({
      values: { locator },
    });
    expect(openedResponse.status, readErrorMessage(openedResponse)).toBe(200);
    const opened = getData(openedResponse);
    const expectedBlobHash = (path: string) =>
      opened.files.find((file: { path: string }) => file.path === path)?.blobHash || null;
    const workspaceEntry = "import { summaryLabel } from './summary-label';\nctx.render(summaryLabel);";
    const saveResponse = await rootAgent.resource('runJSSources').saveChanges({
      values: {
        locator,
        repoId: opened.repository.repoId,
        baseCommitId: opened.repository.headCommitId,
        baseOwnerFingerprint: opened.ownerFingerprint,
        message: 'Materialize finance summary workspace',
        entryPath: 'src/client/index.tsx',
        changes: [
          {
            path: 'src/client/index.tsx',
            operation: 'upsert',
            expectedBlobHash: expectedBlobHash('src/client/index.tsx'),
            content: workspaceEntry,
            language: 'tsx',
          },
          {
            path: 'src/client/summary-label.ts',
            operation: 'upsert',
            expectedBlobHash: expectedBlobHash('src/client/summary-label.ts'),
            content: "export const summaryLabel = 'Legacy inline summary';",
            language: 'typescript',
          },
        ],
      },
    });
    expect(saveResponse.status, readErrorMessage(saveResponse)).toBe(200);
    expect(getData(saveResponse)).toMatchObject({
      artifact: {
        entryPath: 'src/client/index.tsx',
        diagnostics: [],
      },
    });

    const inlineReadback = await getSurface(rootAgent, { uid: block.uid });
    const inlineRunJs = inlineReadback.tree.stepParams?.jsSettings?.runJs;
    expect(inlineRunJs).toMatchObject({
      code: expect.stringContaining('Legacy inline summary'),
      version: 'v1',
      sourceRef: {
        type: 'vsc-file',
        repoId: expect.any(String),
        commitId: expect.any(String),
        entry: 'src/client/index.tsx',
      },
    });
    expect(inlineRunJs?.sourceRef).not.toHaveProperty('path');
    const inlineCode = inlineRunJs?.code;
    const inlineSourceRef = inlineRunJs?.sourceRef;
    expect(inlineCode).not.toContain(workspaceEntry);
    expect(
      collectRunJsAuthoringErrors('applyBlueprint', {
        tabs: [{ blocks: [{ type: 'jsBlock', settings: { code: inlineCode } }] }],
      }),
    ).toEqual([]);
    const ordinaryWrapperErrors = collectRunJsAuthoringErrors('applyBlueprint', {
      tabs: [
        {
          blocks: [
            {
              type: 'jsBlock',
              settings: { code: "function renderLater() { ctx.render('late'); }" },
            },
          ],
        },
      ],
    });
    expect(ordinaryWrapperErrors.map((error) => error.details?.repairClass)).toContain(
      'render-top-level-function-wrapper',
    );
    const spoofedArtifactErrors = collectRunJsAuthoringErrors('applyBlueprint', {
      tabs: [
        {
          blocks: [
            {
              type: 'jsBlock',
              settings: {
                code: [
                  "function renderLater() { ctx.render('late'); }",
                  "const marker = 'const __runjs_require__ = (specifier) => {';",
                  '// runjs-launcher:__runjs_launcher__.js',
                  'return __runjs_entry__.default();',
                  '//# sourceURL=nocobase-runjs://bundle/0123456789abcdef.js',
                ].join('\n'),
              },
            },
          ],
        },
      ],
    });
    expect(spoofedArtifactErrors.map((error) => error.details?.repairClass)).toContain(
      'render-top-level-function-wrapper',
    );
    const nestedRunJsArtifact = await compileRunJSSourceWorkspace({
      files: [
        {
          path: 'src/client/index.tsx',
          content: 'ctx.runjs("api/orders:list");\nctx.render("Orders");',
        },
      ],
      entry: 'src/client/index.tsx',
      surfaceStyle: 'render',
    });
    expect(nestedRunJsArtifact.artifact.diagnostics).toEqual([]);
    const nestedRunJsArtifactErrors = collectRunJsAuthoringErrors('applyBlueprint', {
      tabs: [
        {
          blocks: [
            {
              type: 'jsBlock',
              settings: { code: nestedRunJsArtifact.artifact.code },
            },
          ],
        },
      ],
    });
    expect(nestedRunJsArtifactErrors.map((error) => error.ruleId)).toContain('runjs-nested-runjs-forbidden');

    const actionArtifact = await compileRunJSSourceWorkspace({
      files: [
        {
          path: 'src/client/index.tsx',
          content: 'ctx.message.success("Updated");',
        },
      ],
      entry: 'src/client/index.tsx',
      surfaceStyle: 'action',
    });
    expect(actionArtifact.artifact.diagnostics).toEqual([]);
    const actionArtifactInRenderHostErrors = collectRunJsAuthoringErrors('applyBlueprint', {
      tabs: [
        {
          blocks: [
            {
              type: 'jsBlock',
              settings: { code: actionArtifact.artifact.code },
            },
          ],
        },
      ],
    });
    expect(actionArtifactInRenderHostErrors).not.toEqual([]);
    expect(actionArtifactInRenderHostErrors.map((error) => error.details?.repairClass)).toContain(
      'render-top-level-function-wrapper',
    );
    const artifactBudgetErrors = collectRunJsAuthoringErrors('applyBlueprint', {
      tabs: [
        {
          blocks: Array.from({ length: 101 }, () => ({
            type: 'jsBlock',
            settings: { code: inlineCode },
          })),
        },
      ],
    });
    expect(artifactBudgetErrors.map((error) => error.ruleId)).toContain('runjs-too-many-sources');

    const inlineExportResponse = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
      },
    });
    expect(inlineExportResponse.status, readErrorMessage(inlineExportResponse)).toBe(200);
    const inlineExported = getData(inlineExportResponse);
    const inlineExportedJsBlock = findExportedJsBlock(inlineExported.document.tabs[0].blocks);
    expect(inlineExportedJsBlock?.settings).toMatchObject({
      code: inlineCode,
      version: 'v1',
    });
    expect(inlineExportedJsBlock?.settings).not.toHaveProperty('sourceRef');

    const createDocument = {
      ...inlineExported.document,
      mode: 'create',
      navigation: {
        item: {
          title: 'Imported finance summary',
        },
      },
      page: {
        ...inlineExported.document.page,
        title: 'Imported finance summary',
      },
    };
    delete createDocument.target;
    const createResponse = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: createDocument,
    });
    expect(createResponse.status, readErrorMessage(createResponse)).toBe(200);
    const importedPageSchemaUid = getData(createResponse).target.pageSchemaUid;
    const importedExportResponse = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid: importedPageSchemaUid,
        },
      },
    });
    expect(importedExportResponse.status, readErrorMessage(importedExportResponse)).toBe(200);
    const importedJsBlock = findExportedJsBlock(getData(importedExportResponse).document.tabs[0].blocks);
    expect(importedJsBlock?.settings).toMatchObject({
      code: inlineCode,
      version: 'v1',
    });
    expect(importedJsBlock?.settings).not.toHaveProperty('sourceRef');

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: block.uid,
        },
        changes: {
          sourceMode: 'js-template',
          sourceBinding: JS_TEMPLATE_SOURCE_BINDING,
          settings: {
            region: 'APAC',
          },
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const readback = await getSurface(rootAgent, { uid: block.uid });
    expect(readback.tree.stepParams?.jsSettings?.runJs).toMatchObject({
      code: inlineCode,
      version: 'v1',
      sourceRef: inlineSourceRef,
      sourceMode: 'js-template',
      sourceBinding: JS_TEMPLATE_SOURCE_BINDING,
      settings: {
        region: 'APAC',
      },
    });
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('sourceBinding');
    expect(readback.tree.stepParams?.jsSettings).not.toHaveProperty('settings');

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    expect(exported.unsupported).toEqual([]);

    const exportedJsBlock = findExportedJsBlock(exported.document.tabs[0].blocks);
    expect(exportedJsBlock).toMatchObject({
      type: 'jsBlock',
      settings: {
        code: inlineCode,
        version: 'v1',
        sourceMode: 'js-template',
        sourceBinding: JS_TEMPLATE_SOURCE_BINDING,
        settings: {
          region: 'APAC',
        },
      },
    });
    expect(exportedJsBlock?.settings).not.toHaveProperty('sourceRef');

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: exported.document,
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);

    const replacedExportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
      },
    });
    expect(replacedExportRes.status, readErrorMessage(replacedExportRes)).toBe(200);
    const replaced = getData(replacedExportRes);
    const replacedJsBlock = findExportedJsBlock(replaced.document.tabs[0].blocks);
    expect(replacedJsBlock?.settings).toMatchObject({
      code: inlineCode,
      version: 'v1',
      sourceMode: 'js-template',
      sourceBinding: JS_TEMPLATE_SOURCE_BINDING,
      settings: {
        region: 'APAC',
      },
    });
    expect(replacedJsBlock?.settings).not.toHaveProperty('sourceRef');
  });

  it('should keep inline configure active with canonical workspace sourceRef on readback', async () => {
    const page = await createPage(rootAgent, {
      title: 'Legacy inline configure page',
      tabTitle: 'Main',
    });
    const block = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.tabSchemaUid },
          type: 'jsBlock',
          settings: {
            code: "ctx.render('before');",
            version: 'v1',
          },
        },
      }),
    );
    const initialReadback = await getSurface(rootAgent, { uid: block.uid });
    const inlineSourceRef = initialReadback.tree.stepParams?.jsSettings?.runJs?.sourceRef;
    expect(inlineSourceRef).toMatchObject({
      type: 'vsc-file',
      repoId: expect.any(String),
      commitId: expect.any(String),
      entry: 'src/client/index.tsx',
    });
    expect(inlineSourceRef).not.toHaveProperty('path');

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: block.uid },
        changes: {
          code: "ctx.render('after');",
          version: 'v2',
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const readback = await getSurface(rootAgent, { uid: block.uid });
    expect(readback.tree.stepParams?.jsSettings?.runJs).toEqual({
      code: "ctx.render('after');",
      version: 'v2',
      sourceRef: inlineSourceRef,
    });
    expect(readback.tree.stepParams?.jsSettings?.runJs).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.jsSettings?.runJs).not.toHaveProperty('sourceBinding');
  });

  it('should persist JS action source fields only in clickSettings.runJs', async () => {
    const page = await createPage(rootAgent, {
      title: 'JS action source page',
      tabTitle: 'Main',
    });
    const actionPanel = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'actionPanel',
        },
      }),
    );
    const actionResponse = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: actionPanel.uid,
        },
        type: 'js',
        settings: {
          title: 'Refresh KPI',
          code: "ctx.message.success('Refreshed');",
          version: 'v2',
          sourceMode: 'js-template',
          sourceBinding: JS_TEMPLATE_ACTION_SOURCE_BINDING,
          settings: {
            region: 'APAC',
          },
        },
      },
    });
    expect(actionResponse.status, readErrorMessage(actionResponse)).toBe(200);
    const action = getData(actionResponse);

    let readback = await getSurface(rootAgent, { uid: action.uid });
    expect(readback.tree.stepParams?.clickSettings?.runJs).toMatchObject({
      code: "ctx.message.success('Refreshed');",
      version: 'v2',
      sourceMode: 'js-template',
      sourceBinding: JS_TEMPLATE_ACTION_SOURCE_BINDING,
      settings: {
        region: 'APAC',
      },
    });
    expect(readback.tree.stepParams?.clickSettings).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.clickSettings).not.toHaveProperty('sourceBinding');
    expect(readback.tree.stepParams?.clickSettings).not.toHaveProperty('settings');

    const configureResponse = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: action.uid,
        },
        changes: {
          sourceBinding: {
            templateId: 'jtt_refresh_sales_kpi_v2',
          },
          settings: {
            currency: 'USD',
          },
        },
      },
    });
    expect(configureResponse.status, readErrorMessage(configureResponse)).toBe(200);

    readback = await getSurface(rootAgent, { uid: action.uid });
    expect(readback.tree.stepParams?.clickSettings?.runJs).toMatchObject({
      code: "ctx.message.success('Refreshed');",
      version: 'v2',
      sourceMode: 'js-template',
      sourceBinding: {
        ...JS_TEMPLATE_ACTION_SOURCE_BINDING,
        templateId: 'jtt_refresh_sales_kpi_v2',
      },
      settings: {
        region: 'APAC',
        currency: 'USD',
      },
    });
    expect(readback.tree.stepParams?.clickSettings).not.toHaveProperty('sourceMode');
    expect(readback.tree.stepParams?.clickSettings).not.toHaveProperty('sourceBinding');
    expect(readback.tree.stepParams?.clickSettings).not.toHaveProperty('settings');
  });
});
