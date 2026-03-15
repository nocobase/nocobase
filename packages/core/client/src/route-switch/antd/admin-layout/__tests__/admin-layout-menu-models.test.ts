/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { NocoBaseDesktopRouteType } from '../../../../admin-shell/route-types';
import { AdminLayoutMenuItemModel, AdminLayoutMenuTreeModel } from '../AdminLayoutMenuModels';

describe('AdminLayoutMenuTreeModel', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
  });

  it('should sync route tree into menu subModels and cleanup stale branches', () => {
    const menuTree = engine.createModel<AdminLayoutMenuTreeModel>({
      uid: 'admin-layout-menu',
      use: AdminLayoutMenuTreeModel,
    });

    menuTree.syncRoutes([
      {
        id: 1,
        title: 'Group',
        type: NocoBaseDesktopRouteType.group,
        children: [
          {
            id: 11,
            title: 'Page 1',
            schemaUid: 'page-1',
            type: NocoBaseDesktopRouteType.page,
          },
        ],
      },
      {
        id: 2,
        title: 'Link',
        type: NocoBaseDesktopRouteType.link,
      },
    ]);

    expect(menuTree.subModels.items).toHaveLength(2);
    expect(menuTree.subModels.items?.[0]).toBeInstanceOf(AdminLayoutMenuItemModel);
    expect(menuTree.subModels.items?.[0].subModels.items).toHaveLength(1);
    expect(menuTree.subModels.items?.[0].subModels.items?.[0].props.route).toMatchObject({
      title: 'Page 1',
      schemaUid: 'page-1',
    });

    const staleGroupUid = menuTree.subModels.items?.[0].uid;

    menuTree.syncRoutes([
      {
        id: 2,
        title: 'Link',
        type: NocoBaseDesktopRouteType.link,
      },
    ]);

    expect(menuTree.subModels.items).toHaveLength(1);
    expect(menuTree.subModels.items?.[0].props.route).toMatchObject({
      title: 'Link',
      type: NocoBaseDesktopRouteType.link,
    });
    expect(engine.getModel(staleGroupUid)).toBeUndefined();
  });
});
