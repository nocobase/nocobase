/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import type { FlowModelContext } from '../../../flowContext';
import { FlowEngine } from '../../../flowEngine';
import { FlowModel } from '../../../models';
import type { ModelConstructor } from '../../../types';
import type { SubModelItem } from '../AddSubModelButton';
import { mergeSubModelItems } from '../AddSubModelButton';
import { buildItems, buildSubModelGroups, buildSubModelItem, buildSubModelItems } from '../utils';

type DefineChildren = (ctx: FlowModelContext) => SubModelItem[] | Promise<SubModelItem[]>;
type WithDefineChildren<T extends ModelConstructor = ModelConstructor> = T & { defineChildren: DefineChildren };

function attachDefineChildren<T extends ModelConstructor>(Base: T, def: DefineChildren): WithDefineChildren<T> {
  Object.defineProperty(Base, 'defineChildren', {
    value: def,
    configurable: true,
    writable: true,
  });
  return Base as WithDefineChildren<T>;
}

describe('subModel/utils', () => {
  describe('buildSubModelGroups', () => {
    it('hides group when defineChildren resolves to empty array', async () => {
      const engine = new FlowEngine();

      class EmptyBase extends FlowModel {}
      EmptyBase.define({ label: 'Empty Group' });
      const EmptyBaseDC = attachDefineChildren(EmptyBase, async () => []);

      class NonEmptyBase extends FlowModel {}
      NonEmptyBase.define({ label: 'NonEmpty Group' });
      const NonEmptyBaseDC = attachDefineChildren(NonEmptyBase, async () => [{ key: 'child-1', label: 'Child 1' }]);

      engine.registerModels({ EmptyBase: EmptyBaseDC, NonEmptyBase: NonEmptyBaseDC });

      const model = engine.createModel({ use: 'FlowModel' });
      const ctx = model.context;

      const groupsFactory = buildSubModelGroups([EmptyBaseDC, NonEmptyBaseDC]);
      const groups = await groupsFactory(ctx);

      expect(groups).toHaveLength(1);
      expect(groups[0].type).toBe('group');
      expect(groups[0].label).toBe('NonEmpty Group');
      expect(groups[0].children).toBeTruthy();
    });

    it('hides group when defineChildren throws', async () => {
      const engine = new FlowEngine();

      class ThrowBase extends FlowModel {}
      ThrowBase.define({ label: 'Throw Group' });
      const ThrowBaseDC = attachDefineChildren(ThrowBase, async () => {
        throw new Error('boom');
      });

      class OkBase extends FlowModel {}
      OkBase.define({ label: 'OK Group' });
      const OkBaseDC = attachDefineChildren(OkBase, () => [{ key: 'ok', label: 'OK' }]);

      engine.registerModels({ ThrowBase: ThrowBaseDC, OkBase: OkBaseDC });

      const model = engine.createModel({ use: 'FlowModel' });
      const ctx = model.context;

      const groupsFactory = buildSubModelGroups([ThrowBaseDC, OkBaseDC]);
      const groups = await groupsFactory(ctx);

      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe('OK Group');
    });

    it('shows group when defineChildren resolves to non-empty array', async () => {
      const engine = new FlowEngine();

      class Base extends FlowModel {}
      Base.define({ label: 'Base Group' });
      const BaseDC = attachDefineChildren(Base, async () => [{ key: 'a', label: 'A' }]);

      engine.registerModels({ Base: BaseDC });

      const model = engine.createModel({ use: 'FlowModel' });
      const ctx = model.context;

      const groupsFactory = buildSubModelGroups([BaseDC]);
      const groups = await groupsFactory(ctx);

      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe('Base Group');
      expect(groups[0].children).toBeTruthy();
    });

    it('invokes buildSubModelItems when meta.children is false', async () => {
      const engine = new FlowEngine();

      class Parent extends FlowModel {}

      class Base extends FlowModel {}
      Base.define({ label: 'Base', children: false });

      class Derived extends Base {}
      Derived.define({ label: 'Derived' });

      engine.registerModels({ Parent, Base, Derived });
      const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'parent-children-false' });
      const ctx = parent.context;

      const groupsFactory = buildSubModelGroups([Base]);
      const groups = await groupsFactory(ctx);

      expect(groups).toHaveLength(1);
      const group = groups[0];
      expect(Array.isArray(group.children)).toBe(true);
      expect((group.children as SubModelItem[]).map((item) => item.key)).toEqual(['Derived']);
    });

    it('excludes subclasses already contributed by previous base classes', async () => {
      const engine = new FlowEngine();

      class Parent extends FlowModel {}
      class Root extends FlowModel {}

      class FirstGroup extends Root {}
      FirstGroup.define({ label: 'First Group', children: async () => [{ key: 'from-first', label: 'First' }] });

      class SecondGroup extends Root {}

      class SecondLeaf extends SecondGroup {}
      SecondLeaf.define({ label: 'Second Leaf' });

      engine.registerModels({ Parent, Root, FirstGroup, SecondGroup, SecondLeaf });
      const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'parent-exclude-groups' });
      const ctx = parent.context;

      const groupsFactory = buildSubModelGroups([FirstGroup, SecondGroup]);
      const groups = await groupsFactory(ctx);

      expect(groups).toHaveLength(2);
      const second = groups[1];
      expect(Array.isArray(second.children)).toBe(true);
      expect((second.children as SubModelItem[]).map((item) => item.key)).toEqual(['SecondLeaf']);
    });
  });

  describe('buildSubModelItem', () => {
    it('returns undefined for hidden meta entries', async () => {
      const engine = new FlowEngine();

      class Parent extends FlowModel {}
      class HiddenChild extends FlowModel {}
      HiddenChild.define({ hide: true });

      engine.registerModels({ Parent, HiddenChild });
      const parent = engine.createModel({ use: 'Parent', uid: 'parent-hidden' });

      const item = await buildSubModelItem(HiddenChild, parent.context);
      expect(item).toBeUndefined();
    });

    it('maps meta fields and wraps children createModelOptions', async () => {
      const engine = new FlowEngine();

      class Parent extends FlowModel {}
      class ChildGroup extends FlowModel {}
      ChildGroup.define({
        label: 'Child Group',
        searchable: true,
        searchPlaceholder: 'Search child',
        toggleable: true,
        createModelOptions: { stepParams: { fromMeta: true } },
        children: async () => [
          {
            key: 'leaf',
            label: 'Leaf',
            createModelOptions: async (_ctx, extra) => ({
              stepParams: { fromChild: true },
              extra,
            }),
          },
        ],
      });

      engine.registerModels({ Parent, ChildGroup });
      const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'parent-child-group' });
      const ctx = parent.context;

      const item = await buildSubModelItem(ChildGroup, ctx, false);
      expect(item).toBeTruthy();
      expect(item?.label).toBe('Child Group');
      expect(item?.searchable).toBe(true);
      expect(item?.searchPlaceholder).toBe('Search child');
      expect(item?.toggleable).toBe(true);
      expect(item?.useModel).toBe('ChildGroup');

      const childrenFactory = item?.children as () => Promise<SubModelItem[]>;
      expect(typeof childrenFactory).toBe('function');
      const children = await childrenFactory();
      expect(children).toHaveLength(1);
      const leaf = children[0];
      expect(leaf.label).toBe('Leaf');

      const merged = await (leaf.createModelOptions as any)?.(ctx, { fromTest: true });
      expect(merged?.stepParams).toMatchObject({ fromMeta: true, fromChild: true });
      expect(merged?.extra).toMatchObject({ fromTest: true });
    });

    it('falls back to use=current class name when meta createModelOptions omitted', async () => {
      const engine = new FlowEngine();

      class Parent extends FlowModel {}
      class PlainChild extends FlowModel {}

      engine.registerModels({ Parent, PlainChild });
      const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'parent-default-create-options' });

      const item = await buildSubModelItem(PlainChild, parent.context);
      expect(item?.createModelOptions).toEqual({ use: 'PlainChild' });
    });

    it('still returns item when skipHide=true', async () => {
      const engine = new FlowEngine();

      class Parent extends FlowModel {}
      class HiddenChild extends FlowModel {}
      HiddenChild.define({ hide: true, label: 'Hidden but allowed' });

      engine.registerModels({ Parent, HiddenChild });
      const parent = engine.createModel({ use: 'Parent', uid: 'parent-skip-hide' });

      const item = await buildSubModelItem(HiddenChild, parent.context, true);
      expect(item).toBeTruthy();
      expect(item?.label).toBe('Hidden but allowed');
    });
  });

  describe('buildSubModelItems', () => {
    it('sorts by meta.sort and respects exclusion list', async () => {
      const engine = new FlowEngine();

      class Parent extends FlowModel {}
      class Base extends FlowModel {}
      Base.define({ label: 'Base' });

      class Early extends Base {}
      Early.define({ label: 'Early', sort: 10 });

      class Late extends Base {}
      Late.define({ label: 'Late', sort: 50 });

      class Hidden extends Base {}
      Hidden.define({ label: 'Hidden', hide: true });

      engine.registerModels({ Parent, Base, Early, Late, Hidden });

      const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'parent-sorting' });
      const ctx = parent.context;

      const items = await buildSubModelItems('Base')(ctx);
      expect(items.map((it) => it.key)).toEqual(['Early', 'Late']);

      const excluded = await buildSubModelItems('Base', ['Early'])(ctx);
      expect(excluded.map((it) => it.key)).toEqual(['Late']);
    });

    it('excludes subclasses by constructor reference', async () => {
      const engine = new FlowEngine();

      class Parent extends FlowModel {}
      class Base extends FlowModel {}

      class KeepMe extends Base {}
      KeepMe.define({ label: 'Keep' });

      class RemoveMe extends Base {}
      RemoveMe.define({ label: 'Remove' });

      engine.registerModels({ Parent, Base, KeepMe, RemoveMe });
      const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'parent-exclude-ctor' });
      const ctx = parent.context;

      const items = await buildSubModelItems(Base, [RemoveMe])(ctx);
      expect(items.map((it) => it.key)).toEqual(['KeepMe']);
    });
  });

  it('buildSubModelItems respects meta.searchable and searchPlaceholder', async () => {
    const engine = new FlowEngine();

    class SearchableChild extends FlowModel {}
    // Define meta with searchable flags
    SearchableChild.define({ label: 'Searchable Child', searchable: true, searchPlaceholder: 'Search children' });

    engine.registerModels({ SearchableChild });

    const model = engine.createModel({ use: 'FlowModel' });
    const ctx = model.context;

    // Build items from base class FlowModel so our subclass is included
    const itemsFactory = (await import('../utils')).buildSubModelItems('FlowModel');
    const items = await itemsFactory(ctx);

    const found = items.find((it) => it.key === 'SearchableChild');
    expect(found).toBeTruthy();
    expect(found?.searchable).toBe(true);
    expect(found?.searchPlaceholder).toBe('Search children');
  });

  describe('buildSubModelGroups label and resolution', () => {
    it('falls back to class key when meta label missing', async () => {
      const engine = new FlowEngine();

      class Parent extends FlowModel {}
      class PlainGroup extends FlowModel {}
      const PlainGroupDC = attachDefineChildren(PlainGroup, async () => [
        { key: 'leaf', label: 'Leaf', createModelOptions: { use: 'Parent' } },
      ]);

      engine.registerModels({ Parent, PlainGroup: PlainGroupDC });
      const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'parent-label-fallback' });
      const ctx = parent.context;

      const groupsFactory = buildSubModelGroups(['PlainGroup']);
      const groups = await groupsFactory(ctx);

      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe('PlainGroup');
    });

    it('buildItems unwraps first group children', async () => {
      const engine = new FlowEngine();

      class Parent extends FlowModel {}
      class FirstGroup extends FlowModel {}
      FirstGroup.define({
        label: 'First Group',
        children: () => [
          { key: 'leaf-1', label: 'Leaf 1', createModelOptions: { use: 'Parent' } },
          { key: 'leaf-2', label: 'Leaf 2', createModelOptions: { use: 'Parent' } },
        ],
      });

      engine.registerModels({ Parent, FirstGroup });
      const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'parent-build-items' });
      const ctx = parent.context;

      const factory = buildItems('FirstGroup');
      const items = await factory(ctx);
      expect(items.map((it) => it.key)).toEqual(['leaf-1', 'leaf-2']);
    });

    it('buildItems returns empty array when no groups available', async () => {
      const engine = new FlowEngine();

      class Parent extends FlowModel {}
      class HiddenGroup extends FlowModel {}
      HiddenGroup.define({ label: 'Hidden', hide: true });

      engine.registerModels({ Parent, HiddenGroup });
      const parent = engine.createModel<Parent>({ use: 'Parent', uid: 'parent-empty-build-items' });
      const ctx = parent.context;

      const items = await buildItems('HiddenGroup')(ctx);
      expect(items).toEqual([]);
    });
  });

  describe('mergeSubModelItems', () => {
    it('merges multiple arrays and inserts dividers when requested', async () => {
      const sourceA: SubModelItem[] = [{ key: 'a', label: 'A' }];
      const sourceB: SubModelItem[] = [{ key: 'b', label: 'B' }];
      const merged = mergeSubModelItems([sourceA, sourceB], { addDividers: true });

      const ctx = {} as FlowModelContext;
      const result = Array.isArray(merged) ? merged : await merged(ctx);

      expect(result.map((i) => i.key)).toEqual(['a', 'divider-1', 'b']);
      expect(result[1]?.type).toBe('divider');
    });

    it('flattens nested factories while preserving order', async () => {
      const dynamic = async () => [{ key: 'dynamic', label: 'Dynamic' }];
      const factory = mergeSubModelItems([[{ key: 'a', label: 'A' }], dynamic, async () => [{ key: 'c', label: 'C' }]]);

      const ctx = {} as FlowModelContext;
      const items = await (factory as (ctx: FlowModelContext) => Promise<SubModelItem[]>)(ctx);

      expect(items.map((i) => i.key)).toEqual(['a', 'dynamic', 'c']);
    });

    it('awaits async sources while inserting dividers', async () => {
      const factory = mergeSubModelItems(
        [async () => [{ key: 'first', label: 'First' }], async () => [{ key: 'second', label: 'Second' }]],
        { addDividers: true },
      );

      const ctx = {} as FlowModelContext;
      const items = await (factory as (ctx: FlowModelContext) => Promise<SubModelItem[]>)(ctx);
      expect(items.map((i) => i.key)).toEqual(['first', 'divider-1', 'second']);
      expect(items[1]?.type).toBe('divider');
    });

    it('returns empty array when sources are empty or null', async () => {
      const merged = mergeSubModelItems([undefined, null, []]);
      const ctx = {} as FlowModelContext;
      const result = Array.isArray(merged) ? merged : await merged(ctx);
      expect(result).toEqual([]);
    });

    it('returns original source when only one valid entry', () => {
      const original: SubModelItem[] = [{ key: 'solo', label: 'Solo' }];
      const merged = mergeSubModelItems([null, original, undefined]);
      expect(merged).toBe(original);
    });
  });
});
