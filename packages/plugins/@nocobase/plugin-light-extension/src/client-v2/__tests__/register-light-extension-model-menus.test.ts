/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionGroupModel,
  ActionModel,
  BlockGridModel,
  clearActionGroupMenuItemProviders,
  clearBlockGridSelectSceneAddBlockProviders,
  clearFieldMenuItemProviders,
  resolveFieldMenuItems,
} from '@nocobase/client-v2';
import { FlowEngine, type FlowModelContext, type SubModelItem } from '@nocobase/flow-engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { registerLightExtensionModelMenus } from '../modelMenu/registerLightExtensionModelMenus';

class JSRecordActionModel extends ActionModel {}
JSRecordActionModel.define({ label: 'JS action' });

class TestActionGroupModel extends ActionGroupModel {}
TestActionGroupModel.registerActionModels({ JSRecordActionModel });

describe('registerLightExtensionModelMenus', () => {
  beforeEach(clearProviders);
  afterEach(clearProviders);

  it('contributes Light extension submenus to block, action, field, and column menus', async () => {
    const dispose = registerLightExtensionModelMenus(createApi());
    const blockItems = await resolveBlockItems();
    const actionItems = await TestActionGroupModel.defineChildren(createContext());
    const fieldItems = await resolveFieldMenuItems({
      surface: 'form-field',
      model: {} as never,
      ctx: createContext(),
      items: [
        { key: 'display-fields', sort: 100 },
        { key: 'js-field', sort: 110 },
        { key: 'association-fields', sort: 1000 },
      ],
    });
    const columnItems = await resolveFieldMenuItems({
      surface: 'table-column',
      model: {} as never,
      ctx: createContext(),
    });

    expect(blockItems).toContainEqual(expect.objectContaining({ key: 'light-extension' }));
    expect(actionItems).toContainEqual(expect.objectContaining({ key: 'light-extension' }));
    expect(fieldItems).toContainEqual(expect.objectContaining({ key: 'light-extension' }));
    expect(fieldItems.map((item) => item.key)).toEqual([
      'display-fields',
      'js-field',
      'light-extension',
      'association-fields',
    ]);
    expect(columnItems).toContainEqual(expect.objectContaining({ key: 'light-extension' }));

    dispose();
    expect(await resolveBlockItems()).not.toContainEqual(expect.objectContaining({ key: 'light-extension' }));
    expect(await TestActionGroupModel.defineChildren(createContext())).not.toContainEqual(
      expect.objectContaining({ key: 'light-extension' }),
    );
    expect(
      await resolveFieldMenuItems({ surface: 'form-field', model: {} as never, ctx: createContext() }),
    ).not.toContainEqual(expect.objectContaining({ key: 'light-extension' }));
  });

  it('keeps providers active until every client lane releases its registration', async () => {
    const firstApi = createApi();
    const secondApi = createApi();
    const disposeFirst = registerLightExtensionModelMenus(firstApi);
    const disposeSecond = registerLightExtensionModelMenus(secondApi);

    expect(await resolveBlockItems()).toContainEqual(expect.objectContaining({ key: 'light-extension' }));
    disposeSecond();
    expect(await resolveBlockItems()).toContainEqual(expect.objectContaining({ key: 'light-extension' }));
    disposeFirst();
    expect(await resolveBlockItems()).not.toContainEqual(expect.objectContaining({ key: 'light-extension' }));
  });
});

async function resolveBlockItems(): Promise<SubModelItem[]> {
  const engine = new FlowEngine();
  engine.registerModels({ BlockGridModel });
  engine.context.defineProperty('view', { value: { inputArgs: {} } });
  const model = engine.createModel<BlockGridModel>({ use: 'BlockGridModel' });
  const source = model.addBlockItems;
  return typeof source === 'function' ? source(model.context) : source || [];
}

function createContext(): FlowModelContext {
  const engine = new FlowEngine();
  engine.registerModels({ ActionModel, JSRecordActionModel, TestActionGroupModel });
  return {
    engine,
    t: (key: string) => key,
  } as FlowModelContext;
}

function createApi(): ApiClientLike {
  return {
    request: vi.fn(),
  };
}

function clearProviders() {
  clearBlockGridSelectSceneAddBlockProviders();
  clearActionGroupMenuItemProviders();
  clearFieldMenuItemProviders();
}
