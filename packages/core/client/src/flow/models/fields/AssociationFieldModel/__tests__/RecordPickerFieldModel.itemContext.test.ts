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
});
