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

  async saveStepParams() {
    await super.saveStepParams();

    if (this.stepParams.pageSettings) {
      // 更新路由
      this.context.api.request({
        url: `desktopRoutes:update?filter[id]=${this.props.routeId}`,
        method: 'post',
        data: {
          enableTabs: !!this.stepParams.pageSettings.general.enableTabs,
        },
      });
    }
  }

  async handleDragEnd(event: DragEndEvent) {
    const activeModel = this.flowEngine.getModel(event.active?.id as string);
    const overModel = this.flowEngine.getModel(event.over?.id as string);

    if (!activeModel || !overModel) {
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
