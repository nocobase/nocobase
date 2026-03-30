/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { buildRecordPickerPopupContextInputArgs, injectRecordPickerPopupContext } from '../RecordPickerFieldModel';
import { createRootItemChain } from '../itemChain';
import { SubTableFieldModel } from '../SubTableFieldModel';
import { PopupSubTableFieldModel } from '../PopupSubTableFieldModel';
import { SubFormListFieldModel } from '../SubFormFieldModel';

function createMockCollection(name: string) {
  return {
    name,
    title: name,
    fields: [],
    getFields: () => [],
    getField: () => undefined,
  } as any;
}

function getOpenViewHandler(ModelClass: any) {
  const flow = ModelClass.globalFlowRegistry.getFlow('selectExitRecordSettings');
  const handler = flow?.steps?.openView?.handler;
  expect(typeof handler).toBe('function');
  return handler as (ctx: any, params: any) => any;
}

function createRuntimeCtx(options: { uid: string; value?: any[] }) {
  const formValues = { username: 'alice' };
  const currentItemValue = options.value ?? [{ id: 1, name: 'admin' }];
  const viewerOpen = vi.fn();
  const parentItem = createRootItemChain(formValues);
  const parentItemMeta = {
    title: 'Current item（Users）',
    buildVariablesParams: vi.fn(async () => ({ value: { username: formValues.username } })),
  };
  const parentItemResolver = vi.fn((subPath: string) => subPath.startsWith('value.'));

  const ctx = {
    isMobileLayout: false,
    inputArgs: {
      openerUids: ['outer-view'],
    },
    view: {
      inputArgs: {
        openerUids: ['outer-view'],
      },
    },
    collection: {
      dataSourceKey: 'main',
      filterTargetKey: 'id',
    },
    collectionField: {
      target: 'roles',
      collection: createMockCollection('users'),
      targetCollection: createMockCollection('roles'),
    },
    model: {
      uid: options.uid,
      props: {
        value: currentItemValue,
      },
      selectedRows: {
        value: null,
      },
      context: {},
    },
    viewer: {
      open: viewerOpen,
    },
    layoutContentElement: {},
    getFormValues: () => formValues,
    item: parentItem,
    getPropertyOptions: (name: string) => {
      if (name !== 'item') return undefined;
      return {
        meta: parentItemMeta,
        resolveOnServer: parentItemResolver,
      };
    },
  } as any;

  return {
    ctx,
    formValues,
    currentItemValue,
    parentItem,
    parentItemMeta,
    parentItemResolver,
    viewerOpen,
  };
}

describe('record picker popup context contract for to-many selectors', () => {
  it.each([
    ['SubTableFieldModel', SubTableFieldModel],
    ['PopupSubTableFieldModel', PopupSubTableFieldModel],
    ['SubFormListFieldModel', SubFormListFieldModel],
  ])('%s should pass parent/current/opener context into viewer.open inputArgs', async (_label, ModelClass) => {
    const handler = getOpenViewHandler(ModelClass);
    const { ctx, formValues, currentItemValue, parentItem, parentItemMeta, parentItemResolver, viewerOpen } =
      createRuntimeCtx({
        uid: `model-${String(_label)}`,
      });

    await handler(ctx, { mode: 'drawer', size: 'medium' });

    expect(ctx.model.selectedRows.value).toBe(currentItemValue);
    expect(viewerOpen).toHaveBeenCalledTimes(1);

    const openArgs = viewerOpen.mock.calls[0][0];
    expect(openArgs.inputArgs).toMatchObject({
      parentId: ctx.model.uid,
      scene: 'select',
      dataSourceKey: 'main',
      collectionName: 'roles',
      collectionField: ctx.collectionField,
      parentItem,
      parentItemMeta,
      parentItemResolver,
      currentItemValue,
      openerUids: ['outer-view', ctx.model.uid],
    });

    formValues.username = 'bob';
    currentItemValue.push({ id: 2, name: 'editor' });

    expect(openArgs.inputArgs.parentItem.value.username).toBe('bob');
    expect(openArgs.inputArgs.currentItemValue).toHaveLength(2);
  });
});

describe('injectRecordPickerPopupContext', () => {
  it('should expose live parent item values for popup item context', () => {
    const engine = new FlowEngine();
    const popupModel = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'popup-model' });
    const { ctx, formValues, currentItemValue } = createRuntimeCtx({ uid: 'source-model' });

    const inputArgs = buildRecordPickerPopupContextInputArgs(ctx, {
      currentItemValue,
      extraInputArgs: {
        collectionField: ctx.collectionField,
      },
    });

    injectRecordPickerPopupContext(
      popupModel,
      {
        t: (value: string) => value,
        view: {
          inputArgs,
        },
      },
      ctx.model,
    );

    expect((popupModel.context as any).item.value).toBe(currentItemValue);
    expect((popupModel.context as any).item.parentItem.value.username).toBe('alice');

    formValues.username = 'charlie';

    expect((popupModel.context as any).item.parentItem.value.username).toBe('charlie');
  });
});
