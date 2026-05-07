/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 */

import { describe, it, expect, vi } from 'vitest';
import type { FlowModelContext, SubModelItem } from '@nocobase/flow-engine';
import { tExpr } from '@nocobase/flow-engine';

import {
  transformChildrenToJS,
  buildAssociationJSGroup,
  buildFormAssociationChildren,
  buildJSFieldMenuChildren,
} from '../transformChildrenToJS';
import { AssociationFieldGroupModel } from '../../../base/AssociationFieldGroupModel';

describe('transformChildrenToJS', () => {
  it('returns empty array when items is undefined or false', () => {
    expect(transformChildrenToJS(undefined, { fieldUseModel: 'JSFieldModel', refreshTargets: ['r1'] })).toEqual([]);
    expect(transformChildrenToJS(false, { fieldUseModel: 'JSFieldModel', refreshTargets: ['r1'] })).toEqual([]);
  });

  it('rewrite object-based createModelOptions to add subModels.field.use and populate refreshTargets', async () => {
    const items: SubModelItem[] = [
      {
        key: 'a',
        createModelOptions: {
          use: 'FieldModel',
          subModels: {
            field: { use: 'OriginalModel', keep: true } as any,
          },
        },
      },
    ];

    const out = transformChildrenToJS(items, { fieldUseModel: 'JSFieldModel', refreshTargets: ['rt1'] });
    expect(out).toHaveLength(1);
    expect(out[0].refreshTargets).toEqual(['rt1']);

    const resolved = await (out[0].createModelOptions as any)({} as FlowModelContext);
    expect(resolved.use).toBe('FieldModel');
    expect(resolved.subModels.field.use).toBe('JSFieldModel');
    expect(resolved.subModels.field.keep).toBe(true);
  });

  it('do not overwrite existing refreshTargets', async () => {
    const items: SubModelItem[] = [
      {
        key: 'a',
        refreshTargets: ['self'],
        createModelOptions: { use: 'X' },
      },
    ];

    const out = transformChildrenToJS(items, { fieldUseModel: 'JSFieldModel', refreshTargets: ['rt1'] });
    expect(out[0].refreshTargets).toEqual(['self']);
  });

  it('wrap function-based children and transform returned result', async () => {
    const items: SubModelItem[] = [
      {
        key: 'root',
        children: async () => [
          { key: 'leaf', createModelOptions: { use: 'Leaf', subModels: { field: { use: 'Old' } } } },
        ],
      },
    ];

    const out = transformChildrenToJS(items, { fieldUseModel: 'JSFieldModel', refreshTargets: ['rt'] });
    expect(typeof out[0].children).toBe('function');
    const children = await (out[0].children as any)({} as FlowModelContext);
    expect(children).toHaveLength(1);
    const resolved = await (children[0].createModelOptions as any)({} as FlowModelContext);
    expect(resolved.subModels.field.use).toBe('JSFieldModel');
  });

  it('wrap function-based createModelOptions and forward arguments', async () => {
    const spy = vi.fn(async (_ctx: FlowModelContext, extra?: any) => ({
      use: 'X',
      extra,
      subModels: { field: { use: 'Old' } },
    }));
    const items: SubModelItem[] = [{ key: 'x', createModelOptions: spy as any }];
    const out = transformChildrenToJS(items, { fieldUseModel: 'JSFieldModel', refreshTargets: ['rt'] });
    const extraArg = { foo: 1 };
    const resolved = await (out[0].createModelOptions as any)({} as FlowModelContext, extraArg);
    expect(spy).toHaveBeenCalled();
    expect(resolved.use).toBe('X');
    expect(resolved.extra).toEqual(extraArg);
    expect(resolved.subModels.field.use).toBe('JSFieldModel');
  });
});

describe('buildAssociationJSGroup', () => {
  it('default props and children transformation', async () => {
    const ctx = {} as FlowModelContext;
    const provider = async () =>
      [{ key: 'c1', createModelOptions: { use: 'U', subModels: { field: { use: 'Old' } } } }] as SubModelItem[];

    const group = buildAssociationJSGroup(ctx, provider, {
      fieldUseModel: 'JSEditableFieldModel',
      refreshTargets: ['rtA'],
    });

    expect(group.type).toBe('group');
    expect(group.label).toBe(tExpr('Display association fields'));
    expect(group.searchable).toBe(true);
    expect(group.searchPlaceholder).toBe(tExpr('Search fields'));

    const children = await (group.children as any)(ctx);
    expect(children).toHaveLength(1);
    const resolved = await (children[0].createModelOptions as any)(ctx);
    expect(resolved.subModels.field.use).toBe('JSEditableFieldModel');
    expect(children[0].refreshTargets).toEqual(['rtA']);
  });
});

describe('buildFormAssociationChildren', () => {
  it('call defineChildren with FormItemModel as itemModelName', () => {
    const original = AssociationFieldGroupModel.defineChildren;

    const ctx = {} as FlowModelContext;
    const defineSpy = vi.fn(function (this: any, _ctx: FlowModelContext) {
      expect(this.itemModelName).toBe('FormItemModel');
      return [{ key: 'ok' }] as any;
    });
    AssociationFieldGroupModel.defineChildren = defineSpy;

    try {
      const children = buildFormAssociationChildren(ctx);
      expect(children).toEqual([{ key: 'ok' }]);
      expect(defineSpy).toHaveBeenCalled();
    } finally {
      // 还原静态方法
      AssociationFieldGroupModel.defineChildren = original;
    }
  });
});

describe('buildJSFieldMenuChildren', () => {
  const makeCtx = () => {
    const collection = {
      name: 'posts',
      dataSourceKey: 'main',
      getFields: () => [
        { name: 'title', title: 'Title', options: { interface: 'string' } },
        { name: 'content', title: 'Content', options: { interface: 'string' } },
      ],
    } as any;

    const ctx: any = {
      t: (s: string) => s,
      model: { collection },
      collection,
      engine: {
        // 仅用于兼容 flow-engine 的其它工具在测试过程中可能访问
        getSubclassesOf: vi.fn(() => new Map()),
        getModelClass: vi.fn(() => undefined),
      },
    };
    return ctx as FlowModelContext;
  };

  it('returns only direct collection fields', async () => {
    const ctx = makeCtx();
    const result = await buildJSFieldMenuChildren(ctx, {
      useModel: 'DetailsItemModel',
      fieldUseModel: 'JSFieldModel',
      refreshTargets: ['rt'],
    });
    // 直接子项等于字段数量
    expect(result.length).toBe(2);
    const resolved = await (result[0].createModelOptions as any)(ctx);
    expect(resolved.subModels.field.use).toBe('JSFieldModel');
  });

  it('when associationProvider returns empty array, do not append association group', async () => {
    const ctx = makeCtx();
    const result = await buildJSFieldMenuChildren(ctx, {
      useModel: 'DetailsItemModel',
      fieldUseModel: 'JSFieldModel',
      refreshTargets: ['rt'],
      associationProvider: async () => [],
    });
    expect(result.length).toBe(2);
  });

  it('when associationProvider has results, append the Association Fields (JS) group', async () => {
    const ctx = makeCtx();
    const result = await buildJSFieldMenuChildren(ctx, {
      useModel: 'DetailsItemModel',
      fieldUseModel: 'JSFieldModel',
      refreshTargets: ['rt'],
      associationProvider: async () => [{ key: 'assoc', createModelOptions: { use: 'U' } }],
    });
    // 两个直接字段 + 1 个关联分组
    expect(result.length).toBe(3);
    const group = result[2];
    expect(group.type).toBe('group');
    expect(group.label).toBe(tExpr('Display association fields'));
    // 验证 children 调用可用，并完成 JS 化
    const children = await (group.children as any)(makeCtx());
    expect(Array.isArray(children)).toBe(true);
    const childResolved = await (children[0].createModelOptions as any)(makeCtx());
    expect(childResolved.subModels.field.use).toBe('JSFieldModel');
  });
});
