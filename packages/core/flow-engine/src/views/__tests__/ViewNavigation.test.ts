/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ViewNavigation, generatePathnameFromViewParams } from '../ViewNavigation';

describe('ViewNavigation', () => {
  let mockCtx: any;
  let viewNavigation: ViewNavigation;

  beforeEach(() => {
    mockCtx = {
      router: {
        navigate: vi.fn(),
      },
      route: {
        pathname: '/admin/test',
      },
    };
  });

  describe('changeTo', () => {
    it('should replace current view when viewStack is empty', () => {
      viewNavigation = new ViewNavigation(mockCtx, []);

      viewNavigation.changeTo({ viewUid: 'new-view' });

      expect(viewNavigation.viewStack).toEqual([{ viewUid: 'new-view' }]);
      expect(mockCtx.router.navigate).toHaveBeenCalledWith('/admin/new-view', { replace: true });
    });

    it('should replace last view in viewStack', () => {
      viewNavigation = new ViewNavigation(mockCtx, [{ viewUid: 'old-view' }]);

      viewNavigation.changeTo({ viewUid: 'new-view', tabUid: 'tab1' });

      expect(viewNavigation.viewStack).toEqual([{ viewUid: 'new-view', tabUid: 'tab1' }]);
      expect(mockCtx.router.navigate).toHaveBeenCalledWith('/admin/new-view/tab/tab1', { replace: true });
    });

    it('should replace last view with complex parameters', () => {
      viewNavigation = new ViewNavigation(mockCtx, [{ viewUid: 'view1' }, { viewUid: 'view2', tabUid: 'tab1' }]);

      viewNavigation.changeTo({
        viewUid: 'new-view',
        tabUid: 'new-tab',
        filterByTk: '123',
        sourceId: 'source1',
      });

      expect(viewNavigation.viewStack).toEqual([
        { viewUid: 'view1' },
        { viewUid: 'new-view', tabUid: 'new-tab', filterByTk: '123', sourceId: 'source1' },
      ]);
      expect(mockCtx.router.navigate).toHaveBeenCalledWith(
        '/admin/view1/view/new-view/tab/new-tab/filterbytk/123/sourceid/source1',
        { replace: true },
      );
    });
  });

  describe('navigateTo', () => {
    it('should navigate to new view', () => {
      viewNavigation = new ViewNavigation(mockCtx, [{ viewUid: 'current-view' }]);

      viewNavigation.navigateTo({ viewUid: 'new-view' });

      // viewStack 保持不变
      expect(viewNavigation.viewStack).toEqual([{ viewUid: 'current-view' }]);
      expect(mockCtx.router.navigate).toHaveBeenCalledWith('/admin/current-view/view/new-view');
    });

    it('should not navigate if pathname is the same', () => {
      viewNavigation = new ViewNavigation(mockCtx, [{ viewUid: 'view1' }]);
      mockCtx.route.pathname = '/admin/view1/view/view2';

      viewNavigation.navigateTo({ viewUid: 'view2' });

      expect(mockCtx.router.navigate).not.toHaveBeenCalled();
      expect(viewNavigation.viewStack).toEqual([{ viewUid: 'view1' }]);
    });

    it('should navigate with complex parameters', () => {
      viewNavigation = new ViewNavigation(mockCtx, [{ viewUid: 'view1', tabUid: 'tab1' }]);

      viewNavigation.navigateTo({
        viewUid: 'view2',
        tabUid: 'tab2',
        filterByTk: '456',
        sourceId: 'source2',
      });

      // viewStack 保持不变
      expect(viewNavigation.viewStack).toEqual([{ viewUid: 'view1', tabUid: 'tab1' }]);
      expect(mockCtx.router.navigate).toHaveBeenCalledWith(
        '/admin/view1/tab/tab1/view/view2/tab/tab2/filterbytk/456/sourceid/source2',
      );
    });

    it('should navigate from empty viewStack', () => {
      viewNavigation = new ViewNavigation(mockCtx, []);

      viewNavigation.navigateTo({ viewUid: 'first-view' });

      expect(viewNavigation.viewStack).toEqual([{ viewUid: 'first-view' }]);
      expect(mockCtx.router.navigate).toHaveBeenCalledWith('/admin/first-view');
    });
  });

  describe('back', () => {
    it('should call router navigate with -1', () => {
      viewNavigation = new ViewNavigation(mockCtx, [{ viewUid: 'view1' }]);

      viewNavigation.back();

      expect(mockCtx.router.navigate).toHaveBeenCalledWith(-1);
    });
  });
});

describe('generatePathnameFromViewParams', () => {
  it('should handle empty array', () => {
    expect(generatePathnameFromViewParams([])).toBe('/admin');
    expect(generatePathnameFromViewParams(null as any)).toBe('/admin');
    expect(generatePathnameFromViewParams(undefined as any)).toBe('/admin');
  });

  it('should generate single view path', () => {
    expect(generatePathnameFromViewParams([{ viewUid: 'xxx' }])).toBe('/admin/xxx');
  });

  it('should generate view with tab', () => {
    expect(generatePathnameFromViewParams([{ viewUid: 'xxx', tabUid: 'yyy' }])).toBe('/admin/xxx/tab/yyy');
  });

  it('should generate multiple views', () => {
    expect(generatePathnameFromViewParams([{ viewUid: 'xxx' }, { viewUid: 'yyy' }])).toBe('/admin/xxx/view/yyy');
  });

  it('should generate complex path with all parameters', () => {
    expect(
      generatePathnameFromViewParams([
        { viewUid: 'xxx', tabUid: 'tab1' },
        { viewUid: 'yyy', tabUid: 'tab2', filterByTk: '123', sourceId: 'source1' },
      ]),
    ).toBe('/admin/xxx/tab/tab1/view/yyy/tab/tab2/filterbytk/123/sourceid/source1');
  });

  it('should handle filterByTk and sourceId without tab', () => {
    expect(generatePathnameFromViewParams([{ viewUid: 'xxx', filterByTk: '1', sourceId: '2' }])).toBe(
      '/admin/xxx/filterbytk/1/sourceid/2',
    );
  });

  it('should match parsePathnameToViewParams test cases', () => {
    // Test cases from parsePathnameToViewParams.test.ts
    expect(generatePathnameFromViewParams([{ viewUid: 'xxx' }])).toBe('/admin/xxx');
    expect(generatePathnameFromViewParams([{ viewUid: 'xxx', tabUid: 'yyy' }])).toBe('/admin/xxx/tab/yyy');
    expect(generatePathnameFromViewParams([{ viewUid: 'xxx' }, { viewUid: 'yyy' }])).toBe('/admin/xxx/view/yyy');
    expect(generatePathnameFromViewParams([{ viewUid: 'xxx' }, { viewUid: 'yyy', tabUid: 'zzz' }])).toBe(
      '/admin/xxx/view/yyy/tab/zzz',
    );
    expect(
      generatePathnameFromViewParams([
        { viewUid: 'xxx', tabUid: 'yyy' },
        { viewUid: 'zzz', tabUid: 'aaa' },
      ]),
    ).toBe('/admin/xxx/tab/yyy/view/zzz/tab/aaa');
  });
});
