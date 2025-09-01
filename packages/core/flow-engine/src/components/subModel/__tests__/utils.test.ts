/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { buildSubModelGroups } from '../utils';
import { FlowEngine } from '../../../flowEngine';
import { FlowModel } from '../../../models';
import type { FlowModelContext } from '../../../flowContext';
import type { SubModelItem } from '../AddSubModelButton';
import type { ModelConstructor } from '../../../types';

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
  });
});
