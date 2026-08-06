/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../RootPageModel', async () => {
  const { FlowModel } = await import('@nocobase/flow-engine');
  return {
    RootPageModel: class extends FlowModel {
      onInit() {}
    },
  };
});

import {
  BasePageMenuModel,
  buildPageMenuRoute,
  resolvePageMenuModelByRouteType,
  resolvePageMenuModels,
} from '../BasePageMenuModel';

class LaterPageMenuModel extends BasePageMenuModel {}
LaterPageMenuModel.define({
  icon: 'MailOutlined',
  label: 'Later page',
  routeType: 'laterPage',
  sort: 20,
});

class EarlierPageMenuModel extends BasePageMenuModel {}
EarlierPageMenuModel.define({
  icon: 'BellOutlined',
  label: 'Earlier page',
  routeType: 'earlierPage',
  sort: 10,
});

class HiddenPageMenuModel extends BasePageMenuModel {}
HiddenPageMenuModel.define({
  hide: true,
  label: 'Hidden page',
  routeType: 'hiddenPage',
});

class InvalidPageMenuModel extends BasePageMenuModel {}
InvalidPageMenuModel.define({
  label: 'Invalid page',
  routeType: 'flowPage',
});

describe('BasePageMenuModel', () => {
  it('returns no definitions before the base model is registered', async () => {
    const engine = new FlowEngine();

    await expect(resolvePageMenuModels(engine, engine.context)).resolves.toEqual([]);
  });

  it('discovers visible subclasses and sorts them by model metadata', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      BasePageMenuModel,
      EarlierPageMenuModel,
      HiddenPageMenuModel,
      InvalidPageMenuModel,
      LaterPageMenuModel,
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const definitions = await resolvePageMenuModels(engine, engine.context);

    expect(definitions).toEqual([
      {
        icon: 'BellOutlined',
        label: 'Earlier page',
        modelClass: 'EarlierPageMenuModel',
        routeType: 'earlierPage',
        sort: 10,
      },
      {
        icon: 'MailOutlined',
        label: 'Later page',
        modelClass: 'LaterPageMenuModel',
        routeType: 'laterPage',
        sort: 20,
      },
    ]);
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("route type 'flowPage'"));
    consoleError.mockRestore();
  });

  it('resolves one page menu definition by route type', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ BasePageMenuModel, EarlierPageMenuModel });

    await expect(resolvePageMenuModelByRouteType(engine, 'earlierPage', engine.context)).resolves.toMatchObject({
      modelClass: 'EarlierPageMenuModel',
      routeType: 'earlierPage',
    });
    await expect(resolvePageMenuModelByRouteType(engine, 'missingPage', engine.context)).resolves.toBeUndefined();
  });

  it('excludes empty and duplicate route types', async () => {
    class DuplicatePageMenuModelA extends BasePageMenuModel {}
    DuplicatePageMenuModelA.define({ label: 'Duplicate A', routeType: 'duplicatePage' });

    class DuplicatePageMenuModelB extends BasePageMenuModel {}
    DuplicatePageMenuModelB.define({ label: 'Duplicate B', routeType: 'duplicatePage' });

    class EmptyRouteTypePageMenuModel extends BasePageMenuModel {}
    EmptyRouteTypePageMenuModel.define({ label: 'Empty route type', routeType: '   ' });

    const engine = new FlowEngine();
    engine.registerModels({
      BasePageMenuModel,
      DuplicatePageMenuModelA,
      DuplicatePageMenuModelB,
      EmptyRouteTypePageMenuModel,
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(resolvePageMenuModels(engine, engine.context)).resolves.toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("route type 'duplicatePage'"));
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('must define a non-empty route type'));
    consoleError.mockRestore();
  });

  it('builds a leaf desktop route with the page menu model class', () => {
    const route = buildPageMenuRoute(
      {
        icon: 'BellOutlined',
        label: 'Earlier page',
        modelClass: 'EarlierPageMenuModel',
        routeType: 'earlierPage',
        sort: 10,
      },
      {
        parentId: 12,
        schemaUid: 'page-menu-uid',
        title: 'Custom title',
      },
    );

    expect(route).toEqual({
      icon: 'BellOutlined',
      options: {
        pageMenuModelClass: 'EarlierPageMenuModel',
      },
      parentId: 12,
      schemaUid: 'page-menu-uid',
      title: 'Custom title',
      type: 'earlierPage',
    });
    expect(route.children).toBeUndefined();
    expect(route.enableTabs).toBeUndefined();
  });

  it('disables the flow settings toolbar for page menu models', () => {
    const engine = new FlowEngine();
    engine.registerModels({ EarlierPageMenuModel });
    const model = engine.createModel({ uid: 'page-menu-model', use: 'EarlierPageMenuModel' });

    expect(model.props.showFlowSettings).toBe(false);
  });
});
