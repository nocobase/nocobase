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
import { NocoBaseDesktopRoute } from '../../../../route-switch/antd/admin-layout/convertRoutesToSchema';
import { DragEndEvent } from '@dnd-kit/core';

export class RootPageModel extends PageModel {
  async saveStepParams() {
    await super.saveStepParams();
    // 更新路由
    this.context.api.request({
      url: `desktopRoutes:update?filter[id]=${this.props.routeId}`,
      method: 'post',
      data: {
        enableTabs: !!this.stepParams.pageSettings.general.enableTabs,
      },
    });
  }

  async handleDragEnd(event: DragEndEvent) {
    const activeModel = this.flowEngine.getModel(event.active.id as string);
    const overModel = this.flowEngine.getModel(event.over.id as string);

    if (!activeModel || !overModel) {
      throw new Error('Invalid drag event: missing model');
    }

    await this.context.api.request({
      url: `desktopRoutes:move`,
      method: 'post',
      params: {
        sourceId: activeModel.props.route.id,
        targetId: overModel.props.route.id,
        sortField: 'sort',
      },
    });

    this.flowEngine.moveModel(activeModel.uid, overModel.uid, { persist: false });
  }
}

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
        const routes: NocoBaseDesktopRoute[] = _.castArray(data?.data?.[0]?.children);
        for (const route of routes) {
          // 过滤掉隐藏的路由
          if (route.hideInMenu) {
            continue;
          }

          const model = ctx.engine.createModel({
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
                  icon: route.icon,
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
