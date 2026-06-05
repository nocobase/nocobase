/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockGridModel, CollectionBlockModel, DetailsGridModel, FormComponent } from '@nocobase/client';
import {
  createCurrentRecordMetaFactory,
  createRecordResolveOnServerWithLocal,
  FlowModelRenderer,
  PropertyMetaFactory,
  SingleRecordResource,
  tExpr,
} from '@nocobase/flow-engine';
import { get, noop } from 'lodash';
import React from 'react';

export class NodeDetailsModel extends CollectionBlockModel<{
  parent?: BlockGridModel;
  subModels?: { grid: DetailsGridModel };
}> {
  isManualRefresh = true;

  _defaultCustomModelClasses = {
    RecordActionGroupModel: 'RecordActionGroupModel',
    DetailsItemModel: 'DetailsItemModel',
    DetailsAssociationFieldGroupModel: 'DetailsAssociationFieldGroupModel',
    DetailsCustomItemModel: 'TaskCardCommonItemModel',
  };

  customModelClasses = {};

  get dataSourceKey() {
    return this.getStepParams('resourceSettings', 'init')?.dataSourceKey;
  }

  get collectionName() {
    return this.getStepParams('resourceSettings', 'init')?.collectionName;
  }

  get collection() {
    return this.context.engine.dataSourceManager.getCollection(this.dataSourceKey, this.collectionName);
  }

  get dataPath() {
    return this.getStepParams('resourceSettings', 'init')?.dataPath;
  }

  createResource(ctx, params) {
    const resource = this.context.createResource(SingleRecordResource);
    resource.isNewRecord = false;
    // 禁用刷新功能，该详情区块的数据是从工作流执行上下文中获取的，不需要通过刷新来更新数据
    resource.refresh = noop as any;
    return resource;
  }

  onInit(options: any): void {
    super.onInit(options);
    const recordMeta: PropertyMetaFactory = createCurrentRecordMetaFactory(this.context, () => this.collection);
    this.context.defineProperty('record', {
      get: () => this.getCurrentRecord(),
      cache: false,
      resolveOnServer: createRecordResolveOnServerWithLocal(
        () => this.collection,
        () => this.getCurrentRecord(),
      ),
      meta: recordMeta,
    });
  }

  getCurrentRecord() {
    const { execution, nodes } = this.context.view.inputArgs.flowContext;

    const nodesKeyMap = nodes.reduce((map, node) => Object.assign(map, { [node.id]: node.key }), {});

    const data = {
      $context: execution?.context,
      $jobsMapByNodeKey: (execution?.jobs ?? []).reduce(
        (map, job) => Object.assign(map, { [nodesKeyMap[job.nodeId]]: job.result }),
        {},
      ),
    };

    const result = get(data, this.dataPath);
    return result;
  }

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    return (
      <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}>
        <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
      </FormComponent>
    );
  }
}

NodeDetailsModel.registerFlow({
  key: 'detailsSettings',
  title: tExpr('Details settings'),
  sort: 150,
  steps: {
    init: {
      async handler(ctx) {
        // 1. 先初始化字段网格，确保所有字段都创建完成
        await ctx.model.applySubModelsBeforeRenderFlows('grid');
      },
    },
    layout: {
      use: 'layout',
      title: tExpr('Layout'),
    },
    linkageRules: {
      use: 'detailsFieldLinkageRules',
    },
  },
});

NodeDetailsModel.define({
  hide: true,
});
