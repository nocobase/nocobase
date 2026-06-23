/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createFlowSurfacesContractContext,
  destroyFlowSurfacesContractContext,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

function collectDescendantNodes(node: any, predicate: (input: any) => boolean, bucket: any[] = []) {
  if (!node || typeof node !== 'object') {
    return bucket;
  }
  if (predicate(node)) {
    bucket.push(node);
  }
  const subModels = _.isPlainObject(node.subModels) ? Object.values(node.subModels) : [];
  subModels.forEach((subModel) => {
    _.castArray(subModel).forEach((child) => {
      collectDescendantNodes(child, predicate, bucket);
    });
  });
  return bucket;
}

describe('flowSurfaces JS block RunJS settings contract', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ rootAgent } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should create, patch, replace, reject schema, and export JS block RunJS settings values', async () => {
    const code = [
      "const config = ctx.useSettings({ version: 1, fields: { title: { type: 'string' } } });",
      'ctx.render(config.title);',
    ].join('\n');
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'kpiCards',
                type: 'jsBlock',
                settings: {
                  title: 'KPI Cards',
                  code,
                  version: 'v2',
                  values: {
                    title: 'Initial KPI',
                    threshold: 80,
                    collection: { $type: 'collection', dataSource: 'main', name: 'orders' },
                  },
                },
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const jsBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'JSBlockModel')[0];
    expect(jsBlock?.stepParams?.jsSettings?.runJs).toMatchObject({ code, version: 'v2' });
    expect(jsBlock?.stepParams?.runjsSettings?.configure).toEqual({
      title: 'Initial KPI',
      threshold: 80,
      collection: { $type: 'collection', dataSource: 'main', name: 'orders' },
    });

    const patchRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: jsBlock.uid },
        changes: {
          set: {
            threshold: 95,
            color: 'not-a-color',
          },
          unset: ['title'],
        },
      },
    });
    expect(patchRes.status, readErrorMessage(patchRes)).toBe(200);
    let readback = await getSurface(rootAgent, { uid: jsBlock.uid });
    expect(readback.tree.stepParams?.runjsSettings?.configure).toEqual({
      threshold: 95,
      color: 'not-a-color',
      collection: { $type: 'collection', dataSource: 'main', name: 'orders' },
    });

    const replaceRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: jsBlock.uid },
        changes: {
          values: {
            title: 'Replacement KPI',
          },
        },
      },
    });
    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
    readback = await getSurface(rootAgent, { uid: jsBlock.uid });
    expect(readback.tree.stepParams?.runjsSettings?.configure).toEqual({
      title: 'Replacement KPI',
    });
    expect(readback.tree.stepParams?.jsSettings?.runJs).toMatchObject({ code, version: 'v2' });

    const schemaRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: jsBlock.uid },
        changes: {
          schema: {
            fields: {},
          },
        },
      },
    });
    expect(schemaRes.status).toBe(400);
    expect(readErrorMessage(schemaRes)).toContain('schema is declared by JS code via ctx.useSettings');

    const exportRes = await rootAgent.resource('flowSurfaces').exportBlueprint({
      values: {
        target: {
          pageSchemaUid: data.target.pageSchemaUid,
        },
      },
    });
    expect(exportRes.status, readErrorMessage(exportRes)).toBe(200);
    const exported = getData(exportRes);
    const exportedJsBlock = exported.document.tabs[0].blocks.find((block: any) => block.key === 'kpiCards');
    expect(exportedJsBlock?.settings).toMatchObject({
      code,
      version: 'v2',
      values: {
        title: 'Replacement KPI',
      },
    });
    expect(exportedJsBlock?.settings?.schema).toBeUndefined();
  });
});
