/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import React from 'react';
import { SkeletonFallback } from '../../components/SkeletonFallback';
import { RemoteFlowModelRenderer } from '../../FlowPage';
import { BlockGridModel } from './GridModel';
import { Icon } from '../../../icon';

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
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin: 16 }} />;
  }
  return <FlowModelRenderer model={data} fallback={<SkeletonFallback style={{ margin: 16 }} />} />;
}

export class BasePageTabModel extends FlowModel<{
  subModels: {
    grid: BlockGridModel;
  };
}> {
  getTabTitle(defaultTitle = 'Untitled') {
    return this.context.t(this.stepParams.pageTabSettings?.tab?.title || defaultTitle);
  }

  getTabIcon() {
    return this.stepParams.pageTabSettings?.tab?.icon;
  }

  renderChildren() {
    return null;
  }

  render() {
    return (
      <>
        <Icon style={{ marginRight: 8 }} type={this.getTabIcon()} />
        {this.getTabTitle()}
      </>
    );
  }
}

BasePageTabModel.registerFlow({
  key: 'pageTabSettings',
  title: escapeT('Tab settings'),
  steps: {
    tab: {
      title: escapeT('Edit tab'),
      preset: true,
      uiSchema: {
        title: {
          title: escapeT('Tab name'),
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        icon: {
          title: escapeT('Icon'),
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
          uid: this.props.route.tabSchemaName,
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
      },
    });
  }

  async destroy() {
    this.observerDispose();
    this.invalidateAutoFlowCache(true);
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
