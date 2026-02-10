/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  buildRecordPickerParentItemContext,
  injectRecordPickerPopupContext,
  RecordPickerFieldModel,
} from '../RecordPickerFieldModel';
import {
  buildCurrentItemTitle,
  createAssociationItemChainContextPropertyOptions,
  createItemChainContextPropertyOptions,
  createItemChainGetter,
  createItemChainMetaAndResolver,
  createParentItemAccessorsFromContext,
  createParentItemAccessorsFromInputArgs,
  resolveRecordPersistenceState,
} from '../itemChain';

function createMockCollection() {
  return {
    name: 'users',
    title: 'Users',
    fields: [],
    getFields: () => [],
    getField: () => undefined,
  } as any;
}

describe('RecordPickerFieldModel item context', () => {
  it('itemChain helpers: createParentItemAccessorsFromInputArgs works', () => {
    const inputArgs = {
      parentItem: { value: { id: 1 } },
      parentItemMeta: 'meta-1',
      parentItemResolver: vi.fn(() => true),
    } as any;
    const accessors = createParentItemAccessorsFromInputArgs(() => inputArgs);

    expect(accessors.parentPropertiesAccessor()).toEqual({ id: 1 });
    expect(accessors.parentItemMetaAccessor()).toBe('meta-1');
    expect(accessors.parentItemResolverAccessor()).toBe(inputArgs.parentItemResolver);
  });

  it('itemChain helpers: createParentItemAccessorsFromContext fallback works', () => {
    const parentCtx = {
      item: { value: { name: 'FromParent' } },
      getPropertyOptions: () => ({ meta: 'ctx-meta', resolveOnServer: 'ctx-resolver' }),
    } as any;
    const accessors = createParentItemAccessorsFromContext({
      parentContextAccessor: () => parentCtx,
      fallbackParentPropertiesAccessor: () => ({ name: 'Fallback' }),
    });
    const noParentAccessors = createParentItemAccessorsFromContext({
      parentContextAccessor: () => undefined,
      fallbackParentPropertiesAccessor: () => ({ name: 'Fallback' }),
    });

    expect(accessors.parentPropertiesAccessor()).toEqual({ name: 'FromParent' });
    expect(accessors.parentItemMetaAccessor()).toBe('ctx-meta');
    expect(accessors.parentItemResolverAccessor()).toBe('ctx-resolver');
    expect(noParentAccessors.parentPropertiesAccessor()).toEqual({ name: 'Fallback' });
  });

  it('itemChain helpers: createItemChainGetter works', () => {
    const parentItem = { value: { id: 1 } } as any;
    const getter = createItemChainGetter({
      valueAccessor: () => ({ name: 'FromGetter', __is_new__: true }),
      parentItemAccessor: () => parentItem,
      indexAccessor: () => 2,
      lengthAccessor: () => 4,
    });

    expect(getter()).toMatchObject({
      value: { name: 'FromGetter', __is_new__: true },
      parentItem,
      index: 2,
      length: 4,
      __is_new__: true,
    });
  });

  it('itemChain helpers: resolveRecordPersistenceState works', () => {
    expect(resolveRecordPersistenceState({ id: 1 }, 'id')).toMatchObject({
      hasPrimaryKey: true,
      isNew: false,
      isStored: true,
    });

    expect(resolveRecordPersistenceState({ id: 1, __is_new__: true }, 'id')).toMatchObject({
      hasPrimaryKey: true,
      isNew: true,
      isStored: false,
    });

    expect(resolveRecordPersistenceState({ id: 1, __is_stored__: true }, 'id')).toMatchObject({
      hasPrimaryKey: true,
      isNew: false,
      isStored: true,
    });

    expect(resolveRecordPersistenceState({ code: 'r1' }, ['id', 'code'])).toMatchObject({
      hasPrimaryKey: false,
      isNew: true,
      isStored: false,
    });
  });

  it('itemChain helpers: meta/resolver/contextPropertyOptions can be composed', () => {
    const collection = createMockCollection();
    const t = (value: string) => value;
    const title = buildCurrentItemTitle(t, { title: 'Users' });
    const combo = createItemChainMetaAndResolver({
      metaFactoryOptions: {
        t,
        title,
        collectionAccessor: () => collection,
        propertiesAccessor: () => ({ name: 'A' }),
      },
      resolverOptions: {
        collectionAccessor: () => collection,
        propertiesAccessor: () => ({ name: 'A' }),
      },
    });
    const opts = createItemChainContextPropertyOptions({
      metaFactoryOptions: {
        t,
        title,
        collectionAccessor: () => collection,
        propertiesAccessor: () => ({ name: 'A' }),
      },
      resolverOptions: {
        collectionAccessor: () => collection,
        propertiesAccessor: () => ({ name: 'A' }),
      },
    });
    const associationOpts = createAssociationItemChainContextPropertyOptions({
      t,
      title,
      collectionAccessor: () => collection,
      propertiesAccessor: (ctx) => ctx?.item?.value,
      resolverPropertiesAccessor: () => ({ name: 'A' }),
      parentCollectionAccessor: () => collection,
      parentAccessors: createParentItemAccessorsFromInputArgs(() => ({
        parentItem: { value: { id: 1 } },
        parentItemMeta: 'meta',
        parentItemResolver: vi.fn(() => false),
      })),
    });

    expect(typeof combo.meta).toBe('function');
    expect(typeof combo.resolveOnServer).toBe('function');
    expect(opts.cache).toBe(false);
    expect(opts.serverOnlyWhenContextParams).toBe(true);
    expect(associationOpts.cache).toBe(false);
    expect(associationOpts.serverOnlyWhenContextParams).toBe(true);
  });

  it('优先复用上游 ctx.item 与 item 元信息', () => {
    const parentItem = { value: { id: 1, name: 'Alice' } } as any;
    const meta = vi.fn();
    const resolveOnServer = vi.fn();
    const ctx = {
      item: parentItem,
      getPropertyOptions: vi.fn(() => ({ meta, resolveOnServer })),
      collectionField: { collection: createMockCollection() },
      t: (value: string) => value,
    } as any;

    const result = buildRecordPickerParentItemContext(ctx);

    expect(result.parentItem).toBe(parentItem);
    expect(result.parentItemMeta).toBe(meta);
    expect(result.parentItemResolver).toBe(resolveOnServer);
  });

  it('当上游无 ctx.item 时，自动回落为 ItemChain 并构建 fallback meta/resolver', () => {
    const collection = createMockCollection();
    const ctx = {
      getFormValues: vi.fn(() => ({ name: 'FromGetFormValues' })),
      formValues: { name: 'FromFormValues' },
      record: { name: 'FromRecord' },
      collectionField: { name: 'users', title: 'Users', collection },
      collection,
      getPropertyOptions: vi.fn(() => undefined),
      t: (value: string) => value,
    } as any;

    const result = buildRecordPickerParentItemContext(ctx);

    expect(result.parentItem).toMatchObject({ value: { name: 'FromGetFormValues' }, parentItem: undefined });
    expect(typeof result.parentItemMeta).toBe('function');
    expect(typeof result.parentItemResolver).toBe('function');
  });

  it('openView 会透传 parentItem 相关 inputArgs，并保留现有关键参数', () => {
    const flow = RecordPickerFieldModel.globalFlowRegistry.getFlow('popupSettings');
    const handler = flow?.steps?.openView?.handler;
    expect(typeof handler).toBe('function');

    const open = vi.fn();
    const onChange = vi.fn();
    const setSelectedRows = vi.fn();
    const collection = {
      dataSourceKey: 'main',
      filterTargetKey: 'id',
      getFilterByTK: vi.fn(() => 101),
    } as any;
    const ctx = {
      inputArgs: {
        onChange,
        openerUids: ['parent-view-uid'],
      },
      collection,
      collectionField: {
        type: 'hasMany',
        target: 'roles',
        resourceName: 'users.roles',
        collection,
      },
      item: { value: { id: 101, name: 'Alice' } },
      record: { id: 999 },
      getPropertyOptions: vi.fn(() => ({ meta: 'meta-from-item', resolveOnServer: 'resolver-from-item' })),
      model: {
        uid: 'record-picker-1',
        props: { value: [{ id: 1 }] },
        selectBlockModel: {
          findSubModel: vi.fn(() => ({ resource: { setSelectedRows } })),
        },
        selectedRows: { value: [] },
      },
      viewer: { open },
      layoutContentElement: {},
      t: (value: string) => value,
    } as any;

    handler?.(ctx, { mode: 'drawer', size: 'medium' });

    expect(open).toHaveBeenCalledTimes(1);
    const args = open.mock.calls[0][0];
    expect(args.inputArgs.scene).toBe('select');
    expect(args.inputArgs.collectionName).toBe('roles');
    expect(args.inputArgs.rowSelectionProps.type).toBe('checkbox');
    expect(args.inputArgs.parentItem).toBe(ctx.item);
    expect(args.inputArgs.parentItemMeta).toBe('meta-from-item');
    expect(args.inputArgs.parentItemResolver).toBe('resolver-from-item');
    expect(args.inputArgs.currentItemValue).toEqual({});
    expect(args.inputArgs.associationName).toBe('users.roles');
    expect(args.inputArgs.sourceId).toBe(101);
  });

  it('RemoteModelRenderer 注入 item 到弹窗模型上下文（含上级项链路）', async () => {
    const defineProperty = vi.fn();
    const model = {
      context: {
        defineProperty,
      },
    } as any;
    const viewCtx = {
      t: (value: string) => value,
      view: {
        inputArgs: {
          parentItem: { value: { id: 1, name: 'Alice' }, parentItem: undefined },
          parentItemMeta: 'ignored-parent-meta',
          parentItemResolver: vi.fn(() => false),
          currentItemValue: {},
          collectionField: {
            name: 'roles',
            title: 'Roles',
            collection: createMockCollection(),
            targetCollection: createMockCollection(),
          },
        },
      },
    } as any;
    const fieldModel = { context: { flowSettingsEnabled: true } } as any;

    injectRecordPickerPopupContext(model, viewCtx, fieldModel);

    const flowSettingsCall = defineProperty.mock.calls.find((c) => c[0] === 'flowSettingsEnabled');
    const itemCall = defineProperty.mock.calls.find((c) => c[0] === 'item');
    expect(flowSettingsCall).toBeTruthy();
    expect(itemCall).toBeTruthy();
    expect(itemCall[1].cache).toBe(false);
    expect(typeof itemCall[1].meta).toBe('function');
    expect(typeof itemCall[1].resolveOnServer).toBe('function');
    expect(itemCall[1].serverOnlyWhenContextParams).toBe(true);
    expect(itemCall[1].get()).toMatchObject({
      value: {},
      parentItem: { value: { id: 1, name: 'Alice' } },
    });

    const meta = await itemCall[1].meta();
    expect(meta?.properties?.parentItem).toBeTruthy();
    expect(meta?.properties?.parentItem?.properties?.value).toBeTruthy();
  });
});
