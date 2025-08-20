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

function PageTabChildrenRenderer({ ctx, options }) {
  const { data, loading } = useRequest(
    async () => {
      return await ctx.engine.loadOrCreateModel(options);
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

export class PageTabModel extends FlowModel<{
  subModels: {
    grid: BlockGridModel;
  };
}> {
  getTabTitle(defaultTitle = 'Untitled') {
    return this.context.t(this.stepParams.pageTabSettings?.tab?.title || defaultTitle);
  }

  renderChildren() {
    return null;
  }

  render() {
    return (
      <div>
        <RemoteFlowModelRenderer parentId={this.uid} subKey={'grid'} showFlowSettings={false} />
      </div>
    );
  }
}

PageTabModel.registerFlow({
  key: 'pageTabSettings',
  title: escapeT('Tab settings'),
  steps: {
    tab: {
      preset: true,
      uiSchema: {
        title: {
          title: escapeT('Tab title'),
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
      },
      async handler(ctx, params) {
        ctx.model.setProps('title', params.title);
      },
    },
  },
});

export class MainPageTabModel extends PageTabModel {
  render() {
    return <span>{this.getTabTitle()}</span>;
  }
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
      },
    });
  }

  async destroy() {
    this.observerDispose();
    this.invalidateAutoFlowCache(true);
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

export class SubPageTabModel extends PageTabModel {
  render() {
    return <div>{this.getTabTitle()}</div>;
  }

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
