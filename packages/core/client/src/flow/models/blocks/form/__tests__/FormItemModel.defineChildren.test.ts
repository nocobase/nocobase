/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowEngine, type FlowModelContext, type SubModelItem } from '@nocobase/flow-engine';
// Import from the aggregate to preserve the model initialization order used by adjacent tests.
import { FormItemModel, FormJSFieldItemModel, InputFieldModel, JSEditableFieldModel } from '../../../..';

function createFormMenuContext(prefixFieldPath = 'roles') {
  const engine = new FlowEngine();
  engine.registerModels({
    FormItemModel,
    FormJSFieldItemModel,
    InputFieldModel,
    JSEditableFieldModel,
  });

  const dataSource = engine.dataSourceManager.getDataSource('main');
  dataSource.addCollection({
    name: 'users',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number', title: 'ID' },
      { name: 'roles', type: 'hasMany', interface: 'o2m', target: 'roles', title: 'Roles' },
    ],
  });
  dataSource.addCollection({
    name: 'roles',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number', title: 'ID' },
      { name: 'name', type: 'string', interface: 'input', title: 'Name' },
    ],
  });

  const blockModel = engine.createModel({ use: 'FlowModel', uid: 'users-form-block' });
  (blockModel as any).collection = dataSource.getCollection('users');

  const gridModel = engine.createModel({ use: 'FlowModel', uid: 'users-form-grid' });
  gridModel.context.defineProperty('blockModel', { value: blockModel });
  gridModel.context.defineProperty('collection', { value: dataSource.getCollection('roles') });
  gridModel.context.defineProperty('prefixFieldPath', { value: prefixFieldPath });

  return gridModel.context as FlowModelContext;
}

async function resolveCreateOptions(item: SubModelItem, ctx: FlowModelContext) {
  return typeof item.createModelOptions === 'function' ? await item.createModelOptions(ctx) : item.createModelOptions;
}

function createModelLike(createOptions: any) {
  return {
    getStepParams: (flowKey: string, stepKey: string) => createOptions?.stepParams?.[flowKey]?.[stepKey],
  } as any;
}

describe('FormItemModel defineChildren', () => {
  it('refreshes the JS field submenu when a normal subform field is toggled', () => {
    const ctx = createFormMenuContext();
    const formItems = FormItemModel.defineChildren(ctx) as SubModelItem[];
    const nameItem = formItems.find((item) => item.key === 'roles.name');

    expect(nameItem?.refreshTargets).toEqual(['FormJSFieldItemModel', 'FormItemModel/FormJSFieldItemModel']);
  });

  it('recognizes JS subform fields that store associationPathName and fieldPath separately', async () => {
    const ctx = createFormMenuContext();
    const formItems = FormItemModel.defineChildren(ctx) as SubModelItem[];
    const jsItems = (await FormJSFieldItemModel.defineChildren(ctx)) as SubModelItem[];
    const normalNameItem = formItems.find((item) => item.key === 'roles.name');
    const jsNameItem = jsItems.find((item) => item.key === 'roles.name');

    expect(normalNameItem).toBeTruthy();
    expect(jsNameItem).toBeTruthy();

    const jsCreateOptions = await resolveCreateOptions(jsNameItem, ctx);
    expect(jsCreateOptions?.stepParams?.fieldSettings?.init).toMatchObject({
      associationPathName: 'roles',
      fieldPath: 'name',
    });

    expect((normalNameItem?.toggleable as (model: any) => boolean)(createModelLike(jsCreateOptions))).toBe(true);
  });

  it('lets the JS subform menu recognize normal fields that store the full fieldPath', async () => {
    const ctx = createFormMenuContext();
    const formItems = FormItemModel.defineChildren(ctx) as SubModelItem[];
    const jsItems = (await FormJSFieldItemModel.defineChildren(ctx)) as SubModelItem[];
    const normalNameItem = formItems.find((item) => item.key === 'roles.name');
    const jsNameItem = jsItems.find((item) => item.key === 'roles.name');

    expect(normalNameItem).toBeTruthy();
    expect(jsNameItem).toBeTruthy();

    const normalCreateOptions = await resolveCreateOptions(normalNameItem, ctx);
    expect(normalCreateOptions?.stepParams?.fieldSettings?.init).toMatchObject({
      fieldPath: 'roles.name',
    });

    expect((jsNameItem?.toggleable as (model: any) => boolean)(createModelLike(normalCreateOptions))).toBe(true);
  });
});
