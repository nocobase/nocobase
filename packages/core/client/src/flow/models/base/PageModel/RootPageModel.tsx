/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { PageModel } from './PageModel';

export class RootPageModel extends PageModel {}

RootPageModel.registerFlow({
  key: 'rootPageSettings',
  steps: {
    init: {
      async handler(ctx, params) {
        if (ctx.model.hasSubModel('tabs')) {
          return;
        }
        // TODO: 加载当前页面对应的路由及子节点
        const { data } = await ctx.api.request({
          url: `desktopRoutes:listAccessible?tree=true&sort=sort&filter[parent.schemaUid]=${ctx.model.parentId}`,
        });
        ctx.model.setProps('routeId', data?.data?.[0]?.id);
        const routes = _.castArray(data?.data?.[0]?.children);
        for (const route of routes) {
          const model = await ctx.engine.createModel({
            parentId: ctx.model.uid,
            uid: route.schemaUid,
            subKey: 'tabs',
            subType: 'array',
            use: 'RootPageTabModel',
            props: {
              route,
            },
            stepParams: {
              pageTabSettings: {
                tab: {
                  title: route.title,
                },
              },
            },
          });
          ctx.model.addSubModel('tabs', model);
        }
      },
    },
  },
});
