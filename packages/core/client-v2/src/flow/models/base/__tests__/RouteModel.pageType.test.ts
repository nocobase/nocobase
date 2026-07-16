/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowRuntimeContext } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { JS_PAGE_TYPE, type NocoBaseDesktopRouteOptions, type V2PageType } from '../../../../flow-compat';
import { openView } from '../../../actions/openView';
import { RouteModel } from '../RouteModel';
import {
  JS_PAGE_MODEL,
  resolveRoutePageModelClass,
  ROOT_PAGE_MODEL,
  UNSUPPORTED_V2_PAGE_TYPE,
} from '../resolveRoutePageModelClass';

function getOpenViewDefaultParams(model: RouteModel) {
  const defaultParams = model.getFlow('popupSettings')?.getStep('openView')?.defaultParams;
  if (typeof defaultParams !== 'function') {
    throw new Error('popupSettings.openView.defaultParams is unavailable.');
  }
  return defaultParams(new FlowRuntimeContext(model, 'popupSettings', 'openView'));
}

describe('route page model resolution', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exports the single supported v2 page type through the route contract', () => {
    expectTypeOf(JS_PAGE_TYPE).toEqualTypeOf<V2PageType>();
    expectTypeOf<NocoBaseDesktopRouteOptions['pageType']>().toEqualTypeOf<V2PageType | undefined>();
  });

  it('uses the default or layout root model when pageType is absent', () => {
    expect(resolveRoutePageModelClass()).toBe(ROOT_PAGE_MODEL);
    expect(resolveRoutePageModelClass({ options: {} }, { rootPageModelClass: 'CustomPageModel' })).toBe(
      'CustomPageModel',
    );
  });

  it('resolves JS Page independently of the layout root model', () => {
    expect(
      resolveRoutePageModelClass({ options: { pageType: JS_PAGE_TYPE } }, { rootPageModelClass: 'CustomPageModel' }),
    ).toBe(JS_PAGE_MODEL);
  });

  it('safely ignores malformed route options', () => {
    expect(resolveRoutePageModelClass({ options: null })).toBe(ROOT_PAGE_MODEL);
    expect(resolveRoutePageModelClass({ options: [] })).toBe(ROOT_PAGE_MODEL);
    expect(resolveRoutePageModelClass({ options: 'legacy-data' })).toBe(ROOT_PAGE_MODEL);
  });

  it('does not let the current route pageType affect non-root openView defaults', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    const model = engine.createModel<RouteModel>({ use: 'RouteModel', uid: 'child-open-view' });
    model.context.defineProperty('currentRoute', { value: { options: { pageType: JS_PAGE_TYPE } } });
    model.context.defineProperty('layout', {
      value: { rootPageModelClass: 'CustomRootPageModel', childPageModelClass: 'CustomChildPageModel' },
    });

    await expect(openView.defaultParams(new FlowRuntimeContext(model, 'test', 'openView'))).resolves.toMatchObject({
      pageModelClass: 'CustomChildPageModel',
    });
  });

  it('falls back and reports unknown page types', () => {
    const onUnsupportedPageType = vi.fn();

    expect(
      resolveRoutePageModelClass(
        { id: 42, options: { pageType: 'future-page' } },
        { rootPageModelClass: 'CustomPageModel' },
        onUnsupportedPageType,
      ),
    ).toBe('CustomPageModel');
    expect(onUnsupportedPageType).toHaveBeenCalledWith({
      code: UNSUPPORTED_V2_PAGE_TYPE,
      pageType: 'future-page',
      routeIdentity: '42',
    });
  });

  it('uses the resolver from route-backed openView and warns once per route and page type', () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    const model = engine.createModel<RouteModel>({ use: 'RouteModel', uid: 'route-model-page-type' });
    model.context.defineProperty('currentRoute', {
      value: { id: 'route-model-page-type', options: { pageType: 'future-page' } },
    });
    model.context.defineProperty('layout', { value: { rootPageModelClass: 'CustomPageModel' } });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(getOpenViewDefaultParams(model)).toMatchObject({ pageModelClass: 'CustomPageModel' });
    expect(getOpenViewDefaultParams(model)).toMatchObject({ pageModelClass: 'CustomPageModel' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][1]).toMatchObject({ code: UNSUPPORTED_V2_PAGE_TYPE });
  });
});
