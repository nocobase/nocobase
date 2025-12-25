/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, FlowModel, FlowModelRenderer, observable } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import React from 'react';
import { Icon } from '../../../../icon';
import { SkeletonFallback } from '../../../components/SkeletonFallback';
import { RemoteFlowModelRenderer } from '../../../FlowPage';
import { BlockGridModel } from '../BlockGridModel';

function PageTabChildrenRenderer({ ctx, options }) {
  const { data, loading } = useRequest(
    async () => {
      const model: FlowModel = await ctx.engine.loadOrCreateModel(options);
      model.context.addDelegate(ctx);
      return model;
    },
    {
      refreshDeps: [ctx.model.uid],
    },
  );
  const margin = ctx?.isMobileLayout ? 8 : ctx?.themeToken.marginBlock;
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin }} />;
  }
  return <FlowModelRenderer model={data} fallback={<SkeletonFallback style={{ margin }} />} />;
}

export class BasePageTabModel extends FlowModel<{
  subModels: {
    grid: BlockGridModel;
  };
}> {
  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('tabActive', {
      value: observable.ref(true), // TODO: 默认值应该是 false，且需要在 onMount 中设置为 true。但现在 onMount 有 BUG，会在每次切换 tab 时触发
    });
  }

  getTabTitle(defaultTitle = 'Untitled') {
    return this.context.t(this.stepParams.pageTabSettings?.tab?.title || defaultTitle);
  }

  getTabIcon() {
    return this.stepParams.pageTabSettings?.tab?.icon;
  }

  renderChildren() {
    return null;
  }

  renderHiddenInConfig() {
    return (
      <span style={{ display: 'inline-block', paddingTop: this.context.flowSettingsEnabled ? 10 : 0, opacity: 0.5 }}>
        <Icon style={{ marginRight: 8 }} type={this.getTabIcon()} />
        {this.getTabTitle()}
      </span>
    );
  }

  render() {
    return (
      <span style={{ display: 'inline-block', paddingTop: this.context.flowSettingsEnabled ? 10 : 0 }}>
        <Icon style={{ marginRight: 8 }} type={this.getTabIcon()} />
        {this.getTabTitle()}
      </span>
    );
  }
}

BasePageTabModel.registerFlow({
  key: 'pageTabSettings',
  title: tExpr('Tab settings'),
  steps: {
    tab: {
      title: tExpr('Edit tab'),
      preset: true,
      uiSchema: {
        title: {
          title: tExpr('Tab name'),
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        icon: {
          title: tExpr('Icon'),
          'x-decorator': 'FormItem',
          'x-component': 'IconPicker',
        },
      },
      async handler(ctx, params) {
        ctx.model.setProps('title', params.title);
        ctx.model.setProps('icon', params.icon);
      },
    },
  },
});

export class RootPageTabModel extends BasePageTabModel {
  renderChildren() {
    return (
      <PageTabChildrenRenderer
        ctx={this.context}
        options={{
          parentId: this.uid,
          subKey: 'grid',
          async: true,
          subType: 'object',
          use: 'BlockGridModel',
        }}
      />
    );
  }

  async saveStepParams() {
    return this.save();
  }

  async save() {
    const json = this.serialize();
    await this.context.api.request({
      method: 'post',
      url: 'desktopRoutes:updateOrCreate',
      params: {
        filterKeys: ['schemaUid'],
      },
      data: {
        ...this.props.route,
        title: this.getTabTitle(''),
        icon: this.getTabIcon(),
        options: {
          flowRegistry: json.flowRegistry,
        },
      },
    });
  }

  async destroy() {
    this.observerDispose();
    this.invalidateFlowCache('beforeRender', true);
    this.flowEngine.removeModel(this.uid);
    await this.context.api.request({
      method: 'post',
      url: 'desktopRoutes:destroy',
      params: {
        filter: {
          schemaUid: this.uid,
        },
      },
      data: this.props.route,
    });
    return true;
  }
}

export class ChildPageTabModel extends BasePageTabModel {
  renderChildren() {
    return (
      <PageTabChildrenRenderer
        ctx={this.context}
        options={{
          parentId: this.uid,
          subKey: 'grid',
          async: true,
          subType: 'object',
          use: 'BlockGridModel',
        }}
      />
    );
  }
}

/**
 * @deprecated Use `BasePageTabModel` instead.
 */
export class PageTabModel extends FlowModel<{
  subModels: {
    grid: BlockGridModel;
  };
}> {
  render() {
    return (
      <div>
        <RemoteFlowModelRenderer parentId={this.uid} subKey={'grid'} showFlowSettings={false} />
      </div>
    );
  }
}
