/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { collectFlowSurfaceAuthoringErrors } from '../flow-surfaces/authoring-validation';
import {
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

const LIGHT_EXTENSION_SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_finance',
  entryId: 'entry_finance_summary',
  kind: 'js-block',
};

const LEGACY_SOURCE_REF = {
  type: 'vsc-file',
  path: 'packages/plugins/custom/src/blocks/finance-summary.tsx',
};

function findExportedJsBlock(blocks: Array<Record<string, unknown>>) {
  return blocks.find((item) => item.type === 'jsBlock');
}

describe('flowSurfaces JS block light-extension compatibility', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    rootAgent = context.rootAgent;
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should accept repository binding as the source while rejecting script asset mixing', async () => {
    const missingSourceErrors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              type: 'jsBlock',
              settings: {
                title: 'Missing source binding',
                sourceMode: 'light-extension',
              },
            },
          ],
        },
      ],
    });
    expect(missingSourceErrors.map((error) => error.ruleId)).toContain('jsBlock-sourceBinding-required');
    expect(missingSourceErrors.map((error) => error.ruleId)).not.toContain('jsBlock-source-required');

    const repositorySourceErrors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              type: 'jsBlock',
              settings: {
                sourceMode: 'light-extension',
                sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
                settings: {
                  region: 'APAC',
                },
              },
            },
          ],
        },
      ],
    });
    expect(repositorySourceErrors.map((error) => error.ruleId)).not.toContain('jsBlock-source-required');

    const mixedScriptErrors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        assets: {
          scripts: {
            summaryScript: {
              code: 'ctx.render("Summary");',
              version: 'v2',
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'jsBlock',
                script: 'summaryScript',
                settings: {
                  sourceMode: 'light-extension',
                  sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
                },
              },
            ],
          },
        ],
      },
      {
        applyBlueprintScriptAssets: {
          summaryScript: {
            code: 'ctx.render("Summary");',
            version: 'v2',
          },
        },
      },
    );
    expect(mixedScriptErrors.map((error) => error.ruleId)).toContain('jsBlock-mixed-script-and-light-extension');
  });

  it('should preserve legacy inline code/sourceRef when adding light-extension binding and exporting blueprints', async () => {
    const page = await createPage(rootAgent, {
      title: 'JS block export page',
      tabTitle: 'Main',
    });
    const legacyCode = "ctx.render('Legacy inline summary');";

    const block = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'jsBlock',
          settings: {
            title: 'Finance summary',
            code: legacyCode,
            version: 'v1',
            sourceRef: LEGACY_SOURCE_REF,
          },
        },
      }),
    );

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: block.uid,
        },
        changes: {
          sourceMode: 'light-extension',
          sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
          settings: {
            region: 'APAC',
          },
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const readback = await getSurface(rootAgent, { uid: block.uid });
    expect(readback.tree.stepParams?.jsSettings).toMatchObject({
      runJs: {
        code: legacyCode,
        version: 'v1',
        sourceRef: LEGACY_SOURCE_REF,
      },
      sourceMode: 'light-extension',
      sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
      settings: {
        region: 'APAC',
      },
    });

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
      title: 'Finance summary',
      settings: {
        code: legacyCode,
        version: 'v1',
        sourceRef: LEGACY_SOURCE_REF,
        sourceMode: 'light-extension',
        sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
        settings: {
          region: 'APAC',
        },
      },
    });

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
      code: legacyCode,
      version: 'v1',
      sourceRef: LEGACY_SOURCE_REF,
      sourceMode: 'light-extension',
      sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
      settings: {
        region: 'APAC',
      },
    });
  });
});
