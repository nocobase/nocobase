/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { BlockGridModel } from '@nocobase/client-v2';
import { AddSubModelButton, FlowSettingsButton, type SubModelItem } from '@nocobase/flow-engine';
import React, { useMemo } from 'react';

import { tExpr } from '../locale';
import { useWorkflowPluginCompat, type CanvasNodeLike, type WorkflowLike } from '../workflowPluginCompat';

function toItems(value: SubModelItem | SubModelItem[] | null | undefined): SubModelItem[] {
  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
}

type ResourceSettingsInit = Record<string, unknown> & {
  collectionName?: string;
  dataSourceKey?: string;
};

type CreateModelOptionsWithResourceSettings = Record<string, unknown> & {
  stepParams?: Record<string, unknown> & {
    resourceSettings?: Record<string, unknown> & {
      init?: ResourceSettingsInit;
    };
  };
};

function parseJointCollectionName(value: string) {
  const parts = value.split(':');
  const collectionName = parts.pop();
  const dataSourceKey = parts[0] || 'main';
  return collectionName ? { collectionName, dataSourceKey } : null;
}

function normalizeResourceSettingsInit(init?: ResourceSettingsInit) {
  const collectionName = init?.collectionName;
  if (typeof collectionName !== 'string' || !collectionName.includes(':')) {
    return init;
  }
  const parsed = parseJointCollectionName(collectionName);
  if (!parsed) {
    return init;
  }
  return {
    ...init,
    dataSourceKey: parsed.dataSourceKey,
    collectionName: parsed.collectionName,
  };
}

function normalizeCreateModelOptions(createModelOptions: SubModelItem['createModelOptions']) {
  if (!createModelOptions || typeof createModelOptions === 'function') {
    return createModelOptions;
  }
  const options = createModelOptions as CreateModelOptionsWithResourceSettings;
  const resourceSettings = options.stepParams?.resourceSettings;
  const init = resourceSettings?.init;
  const nextInit = normalizeResourceSettingsInit(init);
  if (nextInit === init) {
    return createModelOptions;
  }
  return {
    ...options,
    stepParams: {
      ...options.stepParams,
      resourceSettings: {
        ...resourceSettings,
        init: nextInit,
      },
    },
  };
}

function normalizeSubModelItems(items: SubModelItem[]) {
  let changed = false;
  const normalizedItems = items.map((item) => {
    const createModelOptions = normalizeCreateModelOptions(item.createModelOptions);
    const children = Array.isArray(item.children) ? normalizeSubModelItems(item.children) : item.children;
    if (createModelOptions === item.createModelOptions && children === item.children) {
      return item;
    }
    changed = true;
    return {
      ...item,
      children,
      createModelOptions,
    };
  });
  return changed ? normalizedItems : items;
}

function hasMenuChildren(item: SubModelItem) {
  return Array.isArray(item.children) && item.children.length > 0;
}

function CCAddBlockButton({ model }: { model: CCBlockGridModel }) {
  const workflowPlugin = useWorkflowPluginCompat();
  const inputArgs = model.context.view?.inputArgs || {};
  const workflow = inputArgs.flowContext?.workflow as WorkflowLike | undefined;
  const availableUpstreams = inputArgs.availableUpstreams as CanvasNodeLike[] | undefined;

  const items = useMemo(() => {
    const upstreams = availableUpstreams || [];
    const dataBlockChildren: SubModelItem[] = [];
    const triggerItems = toItems(
      workflowPlugin.getTrigger(workflow?.type)?.getCreateModelMenuItem?.({
        config: workflow?.config || {},
        nodeType: 'cc',
        workflow,
      }),
    );
    const normalizedTriggerItems = normalizeSubModelItems(triggerItems);
    if (triggerItems.length) {
      dataBlockChildren.push({
        key: 'triggers',
        label: '{{t("Trigger", { ns: "workflow" })}}',
        children: normalizedTriggerItems,
      });
    }

    const nodeItems = normalizeSubModelItems(
      upstreams.flatMap((node) =>
        toItems(workflowPlugin.getInstruction(node.type)?.getCreateModelMenuItem?.({ node, workflow })),
      ),
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

    return [dataBlocks, otherBlocks].filter(hasMenuChildren);
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
