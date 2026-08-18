/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parsePathnameToViewParams } from '@nocobase/flow-engine';
import { createMemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { removeLastPopupPath } from '../../schema-component/antd/page/pagePopupUtils';
import { NocoBaseBuildInPlugin } from '../index';

describe('admin v1/v2 compatibility', () => {
  it('should register both v1 and v2 admin route paths', () => {
    const add = vi.fn();
    NocoBaseBuildInPlugin.prototype.addRoutes.call({
      router: { add },
    } as any);

    const paths = add.mock.calls.map((call) => call[1]?.path).filter(Boolean);

    expect(paths).toEqual(
      expect.arrayContaining(['/admin/:name/*', 'tabs/:tabUid', 'popups/*', 'tab/:tabUid', 'view/*']),
    );
  });

  it('should build a valid nested admin route tree when the page route accepts business segments', () => {
    const add = vi.fn();
    NocoBaseBuildInPlugin.prototype.addRoutes.call({
      router: { add },
    } as any);

    const routeByName = new Map(add.mock.calls.map(([name, route]) => [name, route]));
    const routePath = (name: string) => routeByName.get(name)?.path;
    const routes = [
      {
        path: routePath('admin'),
        children: [
          {
            path: routePath('admin.page'),
            children: [
              {
                path: routePath('admin.page.tabs'),
                children: [{ path: routePath('admin.page.tabs.popups') }],
              },
              { path: routePath('admin.page.popups') },
              {
                path: routePath('admin.page.tab'),
                children: [{ path: routePath('admin.page.tab.view') }],
              },
              { path: routePath('admin.page.view') },
            ],
          },
        ],
      },
    ];

    expect(() =>
      createMemoryRouter(routes, {
        initialEntries: ['/admin/pageA/tabs/tabA'],
      }),
    ).not.toThrow();
  });

  it('should keep v2 tab/view deep link replay semantics', () => {
    const result = parsePathnameToViewParams('/admin/pageA/tab/tabA/view/popupA/tab/tabB/filterbytk/1/sourceid/2');
    expect(result).toEqual([
      { viewUid: 'pageA', tabUid: 'tabA' },
      { viewUid: 'popupA', tabUid: 'tabB', filterByTk: '1', sourceId: '2' },
    ]);
  });

  it('should keep v1 tabs/popups nested close semantics', () => {
    const path = '/admin/pageA/tabs/tabA/popups/popup1/filterbytk/1/popups/popup2/sourceid/2';
    expect(removeLastPopupPath(path)).toBe('/admin/pageA/tabs/tabA/popups/popup1/filterbytk/1');
  });
});
