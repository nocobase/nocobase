/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { MockServer } from '@nocobase/test';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';

describe('flowSurfaces field default bindings', () => {
  let app: MockServer;
  let rootAgent: any;

  beforeAll(async () => {
    app = await createFlowSurfacesMockServer();
    rootAgent = await loginFlowSurfacesRootAgent(app);
  }, 120000);

  beforeEach(async () => {
    rootAgent = await loginFlowSurfacesRootAgent(app);
  });

  afterAll(async () => {
    if (app) {
      await app.destroy();
    }
  });

  it('should expose corrected default uses in catalog candidates across display editable and filter scopes', async () => {
    const collectionName = await createFieldDefaultBindingCollection(rootAgent, app, 'catalog');
    const page = await createPage(rootAgent, {
      title: 'Field default binding catalog page',
      tabTitle: 'Field default binding catalog tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName,
    });
    const formUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName,
    });
    const filterFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'filterForm', {
      dataSourceKey: 'main',
      collectionName,
    });

    const tableCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: tableUid,
          },
        },
      }),
    );
    const formCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: formUid,
          },
        },
      }),
    );
    const filterCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: filterFormUid,
          },
        },
      }),
    );

    expect(findCatalogField(tableCatalog, 'status')).toMatchObject({
      use: 'TableColumnModel',
      fieldUse: 'DisplayEnumFieldModel',
    });
    expect(findCatalogField(tableCatalog, '__collection')).toMatchObject({
      use: 'TableColumnModel',
      fieldUse: 'DisplayEnumFieldModel',
    });

    expect(findCatalogField(formCatalog, 'status')).toMatchObject({
      use: 'FormItemModel',
      fieldUse: 'SelectFieldModel',
    });
    expect(findCatalogField(formCatalog, 'stage')).toMatchObject({
      use: 'FormItemModel',
      fieldUse: 'RadioGroupFieldModel',
    });
    expect(findCatalogField(formCatalog, 'tags')).toMatchObject({
      use: 'FormItemModel',
      fieldUse: 'CheckboxGroupFieldModel',
    });
    expect(findCatalogField(formCatalog, '__collection')).toMatchObject({
      use: 'FormItemModel',
      fieldUse: 'CollectionSelectorFieldModel',
    });

    expect(findCatalogField(filterCatalog, 'status')).toMatchObject({
      use: 'FilterFormItemModel',
      fieldUse: 'SelectFieldModel',
    });
    expect(findCatalogField(filterCatalog, 'enabled')).toMatchObject({
      use: 'FilterFormItemModel',
      fieldUse: 'SelectFieldModel',
    });
    expect(findCatalogField(filterCatalog, 'rank')).toMatchObject({
      use: 'FilterFormItemModel',
      fieldUse: 'NumberFieldModel',
    });
  });

  it('should use corrected default field models for addField addFields and compose write paths', async () => {
    const collectionName = await createFieldDefaultBindingCollection(rootAgent, app, 'writes');
    const page = await createPage(rootAgent, {
      title: 'Field default binding write page',
      tabTitle: 'Field default binding write tab',
    });

    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName,
    });
    const formUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName,
    });
    const editFormUid = await addBlock(rootAgent, page.tabSchemaUid, 'editForm', {
      dataSourceKey: 'main',
      collectionName,
    });

    const displayField = await addField(rootAgent, tableUid, 'status');
    expect((await getSurface(rootAgent, { uid: displayField.fieldUid })).tree.use).toBe('DisplayEnumFieldModel');

    const radioField = await addField(rootAgent, formUid, 'stage');
    expect((await getSurface(rootAgent, { uid: radioField.fieldUid })).tree.use).toBe('RadioGroupFieldModel');

    const addFieldsRes = getData(
      await rootAgent.resource('flowSurfaces').addFields({
        values: {
          target: {
            uid: editFormUid,
          },
          fields: [
            {
              key: 'tags',
              fieldPath: 'tags',
            },
          ],
        },
      }),
    );
    const checkboxGroupField = addFieldsRes.fields[0]?.result;
    expect(checkboxGroupField?.fieldUid).toBeTruthy();
    expect((await getSurface(rootAgent, { uid: checkboxGroupField.fieldUid })).tree.use).toBe(
      'CheckboxGroupFieldModel',
    );

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'composeTable',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName,
              },
              fields: ['status'],
            },
            {
              key: 'composeForm',
              type: 'createForm',
              resource: {
                dataSourceKey: 'main',
                collectionName,
              },
              fields: ['stage', 'tags'],
            },
          ],
        },
      }),
    );

    const composeTable = composeRes.blocks.find((block: any) => block.key === 'composeTable');
    const composeForm = composeRes.blocks.find((block: any) => block.key === 'composeForm');
    expect(composeTable?.uid).toBeTruthy();
    expect(composeForm?.uid).toBeTruthy();

    const composedTableReadback = await getSurface(rootAgent, { uid: composeTable.uid });
    const composedFormReadback = await getSurface(rootAgent, { uid: composeForm.uid });

    expect(getTableFieldUseByPath(composedTableReadback, 'status')).toBe('DisplayEnumFieldModel');
    expect(getGridFieldUseByPath(composedFormReadback, 'stage')).toBe('RadioGroupFieldModel');
    expect(getGridFieldUseByPath(composedFormReadback, 'tags')).toBe('CheckboxGroupFieldModel');
  });
});

function getData(response: any) {
  expect(response.status).toBe(200);
  return response.body.data;
}

async function createFieldDefaultBindingCollection(rootAgent: any, app: MockServer, suffix: string) {
  const collectionName = `field_default_bindings_${suffix}_${Date.now()}`;
  const applyResponse = await rootAgent.resource('collections').apply({
    values: {
      name: collectionName,
      template: 'general',
      fields: [
        {
          name: 'title',
          interface: 'input',
        },
        {
          name: 'status',
          type: 'string',
          interface: 'select',
          enum: [
            { label: 'Draft', value: 'draft', color: 'gold' },
            { label: 'Published', value: 'published', color: 'green' },
          ],
        },
        {
          name: 'stage',
          type: 'string',
          interface: 'radioGroup',
          enum: [
            { label: 'Backlog', value: 'backlog', color: 'blue' },
            { label: 'Ready', value: 'ready', color: 'green' },
          ],
        },
        {
          name: 'tags',
          type: 'array',
          interface: 'checkboxGroup',
          enum: [
            { label: 'Urgent', value: 'urgent', color: 'red' },
            { label: 'External', value: 'external', color: 'purple' },
          ],
        },
        {
          interface: 'tableoid',
        },
        {
          name: 'enabled',
          type: 'boolean',
          interface: 'checkbox',
        },
        {
          name: 'rank',
          type: 'integer',
          interface: 'number',
        },
      ],
    },
  });
  expect(applyResponse.status).toBe(200);

  await waitForFixtureCollectionsReady(app.db as any, {
    [collectionName]: ['title', 'status', 'stage', 'tags', 'enabled', 'rank'],
  });

  return collectionName;
}

async function createPage(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').createPage({
      values,
    }),
  );
}

async function addBlock(rootAgent: any, targetUid: string, type: string, resourceInit: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: targetUid,
        },
        type,
        resourceInit,
      },
    }),
  ).uid;
}

async function addField(rootAgent: any, targetUid: string, fieldPath: string) {
  return getData(
    await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: targetUid,
        },
        fieldPath,
      },
    }),
  );
}

async function getSurface(rootAgent: any, target: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').get({
      ...target,
    }),
  );
}

function findCatalogField(catalog: any, key: string) {
  return _.castArray(catalog?.fields || []).find((item: any) => item?.key === key);
}

function getTableFieldUseByPath(readback: any, fieldPath: string) {
  const column = _.castArray(readback?.tree?.subModels?.columns || []).find(
    (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === fieldPath,
  );
  return column?.subModels?.field?.use || _.castArray(column?.subModels?.field || [])[0]?.use;
}

function getGridFieldUseByPath(readback: any, fieldPath: string) {
  const grid = _.castArray(readback?.tree?.subModels?.grid || [])[0];
  const item = _.castArray(grid?.subModels?.items || []).find(
    (node: any) => node?.stepParams?.fieldSettings?.init?.fieldPath === fieldPath,
  );
  return item?.subModels?.field?.use || _.castArray(item?.subModels?.field || [])[0]?.use;
}
