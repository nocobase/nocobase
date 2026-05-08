/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DragEndEvent } from '@dnd-kit/core';
import { reaction } from '@nocobase/flow-engine';
import type { FlowModel } from '@nocobase/flow-engine';
import _ from 'lodash';
import type { NocoBaseDesktopRoute } from '../../../../route-switch/antd/admin-layout/convertRoutesToSchema';
import { PageModel } from './PageModel';

export class RootPageModel extends PageModel {
  mounted = false;

  /**
   * 打开页面设置前，把标签页开关表单值同步为路由表中的当前状态。
   */
  private syncPageSettingsEnableTabsFromRoute() {
    const routeEnableTabs = (this.context as any)?.currentRoute?.enableTabs;
    if (typeof routeEnableTabs !== 'boolean') {
      return;
    }
    this.setStepParams('pageSettings', 'general', {
      enableTabs: routeEnableTabs,
    });
  }

  /**
   * 保存页面设置后立即同步当前页面状态，让标签页显隐无需等路由列表刷新或页面重载。
   */
  private syncEnableTabsToCurrentPage(enableTabs: boolean) {
    const currentRoute = (this.context as any)?.currentRoute;
    const routeId = this.props.routeId;
    if (currentRoute && (routeId == null || currentRoute.id == null || String(currentRoute.id) === String(routeId))) {
      currentRoute.enableTabs = enableTabs;
    }
    this.setProps('enableTabs', enableTabs);
  }

  /**
   * 新建 tab 在首次保存完成前，前端 route 里可能还没有数据库 id。
   * 拖拽前兜底触发一次保存，确保 move 接口拿到真实主键。
   *
   * @param model - 当前参与拖拽的 tab model
   * @returns 可用于排序接口的 route id
   */
  private async ensurePersistedRouteId(model?: FlowModel): Promise<string | number | undefined> {
    const routeId = model?.props?.route?.id;
    if (routeId != null) {
      return routeId;
    }

    if (typeof model?.save === 'function') {
      await model.save();
    }

    return model?.props?.route?.id;
  }

  onMount() {
    super.onMount();

    reaction(
      () => this.context.pageActive.value,
      () => {
        if (this.context.pageActive.value && this.mounted) {
          const firstTab = this.subModels.tabs?.[0];
          if (firstTab) {
            this.setProps('tabActiveKey', firstTab.uid);
            this.invokeTabModelLifecycleMethod(firstTab.uid, 'onActive', true);
          }
        }
        if (this.context.pageActive.value === false) {
          if (this.props.tabActiveKey) {
            this.invokeTabModelLifecycleMethod(this.props.tabActiveKey, 'onInactive');
          } else {
            const firstTab = this.subModels.tabs?.[0];
            if (firstTab) {
              this.invokeTabModelLifecycleMethod(firstTab.uid, 'onInactive');
            }
          }
        }
        this.mounted = true;
      },
    );
  }

  async openFlowSettings(options?: Parameters<PageModel['openFlowSettings']>[0]) {
    if (options?.flowKey === 'pageSettings' && options?.stepKey === 'general') {
      this.syncPageSettingsEnableTabsFromRoute();
    }
    return super.openFlowSettings(options);
  }

  async saveStepParams() {
    await super.saveStepParams();

    if (this.stepParams.pageSettings) {
      const enableTabs = !!this.stepParams.pageSettings.general.enableTabs;
      // 更新路由
      await this.context.api.request({
        url: `desktopRoutes:update?filter[id]=${this.props.routeId}`,
        method: 'post',
        data: {
          enableTabs,
        },
      });
      this.syncEnableTabsToCurrentPage(enableTabs);
      await this.context.refreshDesktopRoutes?.();
    }
  }

  async handleDragEnd(event: DragEndEvent) {
    const activeModel = this.flowEngine.getModel(event.active?.id as string);
    const overModel = this.flowEngine.getModel(event.over?.id as string);

    if (!activeModel || !overModel) {
      return;
    }

    // 自拖拽不需要排序，也要避免对同一个新建 tab 并发保存两次。
    if (activeModel.uid === overModel.uid) {
      return;
    }

    const [sourceId, targetId] = await Promise.all([
      this.ensurePersistedRouteId(activeModel),
      this.ensurePersistedRouteId(overModel),
    ]);

    if (sourceId == null || targetId == null) {
      return;
    }

    await this.context.api.request({
      url: `desktopRoutes:move`,
      method: 'post',
      params: {
        sourceId,
        targetId,
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
        const route = ctx.routeRepository.getRouteBySchemaUid(ctx.model.parentId);
        ctx.model.setProps('routeId', route?.id);
        const routes: NocoBaseDesktopRoute[] = _.castArray(route?.children);
        for (const route of routes.sort((a, b) => a.sort - b.sort)) {
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
            sortIndex: route.sort,
            props: {
              route,
            },
            flowRegistry: route.options?.flowRegistry,
            stepParams: {
              pageTabSettings: {
                tab: {
                  title: route.title,
                  icon: route.icon,
                  documentTitle: route.options?.documentTitle,
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
