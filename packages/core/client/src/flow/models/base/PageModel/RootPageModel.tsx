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
import { escapeT, useFlowContext } from '@nocobase/flow-engine';
import { Switch } from 'antd';
import React from 'react';

export class RootPageModel extends PageModel {
  async saveStepParams() {
    await super.saveStepParams();
    // 更新路由
    await this.context.api.request({
      url: `desktopRoutes:update?filter[id]=${this.props.routeId}`,
      method: 'post',
      data: {
        enableTabs: !!this.stepParams.pageSettings.general.enableTabs,
      },
    });

    // 触发 UI 刷新
    this.context.currentFlow.refreshDesktopRoutes();
  }

  async handleDragEnd(event: DragEndEvent) {
    const activeModel = this.flowEngine.getModel(event.active?.id as string);
    const overModel = this.flowEngine.getModel(event.over?.id as string);

    if (!activeModel || !overModel) {
      return;
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
        const { data } = await ctx.api.request({
          url: `desktopRoutes:getAccessible`,
          params: {
            sort: 'sort',
            filter: {
              schemaUid: ctx.model.parentId,
            },
            appends: ['children'],
          },
        });
        ctx.model.setProps('routeId', data?.data?.id);
        const routes: NocoBaseDesktopRoute[] = _.castArray(data?.data?.children);
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

// 覆盖 PageModel 注册的流
RootPageModel.registerFlow({
  key: 'pageSettings',
  title: escapeT('Page settings'),
  steps: {
    general: {
      title: escapeT('Edit page'),
      uiSchema: {
        title: {
          type: 'string',
          title: escapeT('Page title'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-reactions': {
            dependencies: ['displayTitle'],
            fulfill: {
              state: {
                visible: '{{$deps[0]}}',
              },
            },
          },
        },
        displayTitle: {
          type: 'boolean',
          title: escapeT('Display page title'),
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        enableTabs: {
          type: 'boolean',
          title: escapeT('Enable tabs'),
          'x-decorator': 'FormItem',
          'x-component': (props) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const ctx = useFlowContext();
            return <Switch {...props} value={undefined} defaultValue={ctx.currentFlow.currentRoute.enableTabs} />;
          },
        },
      },
      defaultParams(ctx) {
        return {
          displayTitle: true,
          enableTabs: ctx.currentFlow.currentRoute.enableTabs,
        };
      },
      async handler(ctx, params) {
        ctx.model.setProps('displayTitle', params.displayTitle);
        if (!ctx.model.context.closable) {
          ctx.model.setProps('title', ctx.t(params.title || ctx.model.context.currentFlow.currentRoute?.title));
        } else {
          ctx.model.setProps('title', params.title ? ctx.t(params.title) : null);
        }
        ctx.model.setProps('enableTabs', ctx.currentFlow.currentRoute.enableTabs);

        if (ctx.model.context.closable) {
          ctx.model.setProps('headerStyle', {
            backgroundColor: ctx.themeToken.colorBgLayout,
          });
          ctx.model.setProps('tabBarStyle', {
            backgroundColor: ctx.themeToken.colorBgLayout,
            paddingInline: 16,
            marginBottom: 0,
          });
        } else {
          ctx.model.setProps('headerStyle', {
            backgroundColor: ctx.themeToken.colorBgContainer,
          });
          ctx.model.setProps('tabBarStyle', {
            backgroundColor: ctx.themeToken.colorBgContainer,
            paddingInline: 16,
            marginBottom: 0,
          });
        }
      },
    },
  },
});
