/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { BlockGridModel, usePlugin } from '@nocobase/client-v2';
import { PluginWorkflowClientV2 } from '@nocobase/plugin-workflow/client-v2';
import { AddSubModelButton, FlowSettingsButton, type SubModelItem } from '@nocobase/flow-engine';
import React, { useMemo } from 'react';

import { tExpr } from '../locale';

type WorkflowPluginLike = {
  getInstruction?: (type?: string) => {
    getCreateModelMenuItem?: (args: {
      node: CanvasNodeLike;
      workflow?: WorkflowLike;
    }) => SubModelItem | SubModelItem[] | null;
  };
  getTriggerOptions?: (type?: string) => {
    getCreateModelMenuItem?: (args: {
      config: Record<string, unknown>;
      nodeType?: string;
      workflow?: WorkflowLike;
    }) => SubModelItem | SubModelItem[] | null;
  };
};

type WorkflowLike = {
  config?: Record<string, unknown>;
  type?: string;
};

type CanvasNodeLike = {
  config?: Record<string, unknown>;
  key?: string;
  type?: string;
};

function toItems(value: SubModelItem | SubModelItem[] | null | undefined): SubModelItem[] {
  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
}

function CCAddBlockButton({ model }: { model: CCBlockGridModel }) {
  const workflowPlugin = usePlugin(PluginWorkflowClientV2) as WorkflowPluginLike;
  const inputArgs = model.context.view?.inputArgs || {};
  const workflow = inputArgs.flowContext?.workflow as WorkflowLike | undefined;
  const availableUpstreams = inputArgs.availableUpstreams as CanvasNodeLike[] | undefined;

  const items = useMemo(() => {
    const upstreams = availableUpstreams || [];
    const dataBlockChildren: SubModelItem[] = [];
    const triggerItems = toItems(
      workflowPlugin.getTriggerOptions?.(workflow?.type)?.getCreateModelMenuItem?.({
        config: workflow?.config || {},
        nodeType: 'cc',
        workflow,
      }),
    );
    if (triggerItems.length) {
      dataBlockChildren.push({
        key: 'triggers',
        label: '{{t("Triggers", { ns: "workflow" })}}',
        children: triggerItems,
      });
    }

    const nodeItems = upstreams.flatMap((node) =>
      toItems(workflowPlugin.getInstruction?.(node.type)?.getCreateModelMenuItem?.({ node, workflow })),
    );
    if (nodeItems.length) {
      dataBlockChildren.push({
        key: 'nodes',
        label: '{{t("Node result", { ns: "workflow" })}}',
        children: nodeItems,
      });
    }

    const dataBlocks: SubModelItem = {
      key: 'dataBlocks',
      type: 'group',
      label: tExpr('Data blocks'),
      children: dataBlockChildren,
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

    return [dataBlocks, otherBlocks].filter((group) => group.children?.length);
  }, [availableUpstreams, workflow, workflowPlugin]);

  return (
    <AddSubModelButton model={model} subModelKey="items" items={items}>
      <FlowSettingsButton icon={<PlusOutlined />}>{model.context.t('Add block')}</FlowSettingsButton>
    </AddSubModelButton>
  );
}

export class CCBlockGridModel extends BlockGridModel {
  renderAddSubModelButton() {
    if (!this.context.flowSettingsEnabled) {
      return null;
    }

    return <CCAddBlockButton model={this} />;
  }
}

CCBlockGridModel.define({
  hide: true,
});

export default CCBlockGridModel;
