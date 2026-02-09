/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { BlockGridModel, usePlugin } from '@nocobase/client';
import { AddSubModelButton, FlowSettingsButton, SubModelItem, tExpr } from '@nocobase/flow-engine';
import React, { useMemo } from 'react';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';
import _ from 'lodash';

const CCAddBlockButton = ({ model }: { model: CCBlockGridModel }) => {
  const { t } = model.context;
  const trigger = model.context.view.inputArgs.trigger;
  const workflow = model.context.view.inputArgs.flowContext.workflow;
  const nodes = model.context.view.inputArgs.availableUpstreams;
  const workflowPlugin = usePlugin(WorkflowPlugin);

  const items = useMemo(() => {
    const dataBlocksChildren: SubModelItem[] = [];

    // Trigger Data
    const triggerData = _.castArray(
      trigger.getCreateModelMenuItem?.({ config: workflow.config, nodeType: 'cc' }),
    ).filter(Boolean);
    if (triggerData?.length) {
      dataBlocksChildren.push({
        key: 'triggers',
        label: tExpr('Triggers', { ns: 'workflow' }),
        children: triggerData,
      });
    }

    // Node Data - 过滤掉审批节点，因为抄送插件不需要显示审批相关的区块
    const nodeBlocks: SubModelItem[] = nodes
      .map((node) => {
        const instruction = workflowPlugin.instructions.get(node.type);
        return instruction?.getCreateModelMenuItem?.({ node, workflow });
      })
      .filter(Boolean);

    if (nodeBlocks.length > 0) {
      dataBlocksChildren.push({
        key: 'nodes',
        label: tExpr('Node result', { ns: 'workflow' }),
        children: nodeBlocks,
      });
    }

    const dataBlocks: SubModelItem = {
      key: 'dataBlocks',
      type: 'group',
      label: tExpr('Data blocks'),
      children: dataBlocksChildren,
    };

    const otherBlocks: SubModelItem = {
      key: 'otherBlocks',
      type: 'group',
      label: tExpr('Other blocks'),
      children: [
        {
          key: 'markdown',
          label: tExpr('Markdown'),
          useModel: 'MarkdownBlockModel',
          createModelOptions: {
            use: 'MarkdownBlockModel',
          },
        },
        {
          key: 'jsBlock',
          label: tExpr('JS block'),
          useModel: 'JSBlockModel',
          createModelOptions: {
            use: 'JSBlockModel',
          },
        },
      ],
    };

    return [dataBlocks, otherBlocks].filter((group) => group.children && group.children.length > 0);
  }, [
    model.context.collection?.dataSourceKey,
    model.context.collection?.name,
    nodes,
    trigger,
    workflow,
    workflowPlugin.instructions,
  ]);

  return (
    <AddSubModelButton model={model} subModelKey="items" items={items}>
      <FlowSettingsButton icon={<PlusOutlined />}>{t('Add block')}</FlowSettingsButton>
    </AddSubModelButton>
  );
};

export class CCBlockGridModel extends BlockGridModel {
  renderAddSubModelButton() {
    if (!this.context.flowSettingsEnabled) {
      return null;
    }

    return <CCAddBlockButton model={this} />;
  }
}
