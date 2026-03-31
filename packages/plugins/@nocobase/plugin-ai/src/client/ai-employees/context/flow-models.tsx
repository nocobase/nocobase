/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ContextItem, WorkContextOptions } from '../types';
import { BuildOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
// @ts-ignore
import { FlowModel, FlowModelContext, MultiRecordResource, useFlowEngine } from '@nocobase/flow-engine';
import _ from 'lodash';
import { aiSelection } from '../stores/ai-selection';
import { CollectionBlockModel, FormBlockModel, FormItemModel } from '@nocobase/client';
import { FlowUtils } from '../flow';
import { Space } from 'antd';
import { dialogController } from '../stores/dialog-controller';

type SimplifyComponentNode = {
  uid: string;
  title: string;
  component: string;
  props?: Record<string, unknown>;
  children?: Record<string, SimplifyComponentNode[]>;
  data?: unknown;
};

const parseFlowModel = async (model: FlowModel) => {
  if (!model) {
    return {};
  }
  if (model instanceof FormBlockModel) {
    return toSimplifyForm(model);
  } else if (model instanceof CollectionBlockModel) {
    return await toCollection(model);
  } else {
    return await toSimplifyComponentTree(model);
  }
};

const toSimplifyForm = (model: FormBlockModel) => {
  const result = {
    uid: model.uid,
    fields: [],
  };
  const duplicateFields = new Set();
  FlowUtils.walkthrough(model, (model) => {
    if (model instanceof FormItemModel && !duplicateFields.has(model.collectionField.name)) {
      const collectionField = model.collectionField;
      result.fields.push({
        name: collectionField.name,
        type: collectionField.type,
        // title: collectionField.title,
        enum: collectionField.enum,
        readonly: collectionField.readonly,
        defaultValue: collectionField.defaultValue,
      });
      duplicateFields.add(collectionField.name);
    }
  });
  if (model.form) {
    result['value'] = model.form.getFieldsValue();
  }
  return result;
};

const toCollection = async (model: CollectionBlockModel) => {
  const collection = FlowUtils.getCollection(model);
  if (model.resource instanceof MultiRecordResource) {
    return {
      dataScope: {
        filter: model?.resource?.getFilter(),
      },
      collection: {
        ...collection,
      },
      prompt: `You can use the tools dataSource-dataSourceQuery to query data from a data source and dataSource-dataSourceCounting to get record counts.
When analyzing user messages, if any words or phrases are related or similar to a known collectionName, prioritize retrieving relevant data before responding.
When the user asks about quantities, totals, or record counts, you must first call dataSource-dataSourceCounting to obtain accurate numbers before answering.
Always apply dataScope.filter when calling dataSource-dataSourceQuery or dataSource-dataSourceCounting. Ensure that the filter structure is properly transformed to match the tools’ input format.
Do not mention or reveal any details about tools, data sources, or internal processes in your reply.
Unless the user explicitly requests it, do not directly output large amounts of raw data—summarize, filter, or aggregate the results naturally in your response.`,
    };
  } else {
    return {
      collection: {
        ...collection,
      },
      data: await FlowUtils.getResource(model),
    };
  }
};

const toSimplifyComponentTree = async (model: FlowModel) => {
  const result: SimplifyComponentNode = {
    uid: model.uid,
    title: model.title,
    component: model.use,
  };

  if (model instanceof FormItemModel) {
    const collectionField = model.collectionField;
    result.props = {
      readonly: collectionField.readonly,
      name: collectionField.name,
      type: collectionField.type,
      dataType: collectionField.dataType,
      title: collectionField.title,
      enum: collectionField.enum,
      defaultValue: collectionField.defaultValue,
    };
  } else {
    result.props = { ...model.props };
  }

  if (model.subModels) {
    result.children = {};
    for (const [key, value] of Object.entries(model.subModels)) {
      result.children[key] = [];
      const flowModels = _.isArray(value) ? value : [value];
      for (const flowModel of flowModels) {
        result.children[key].push(await toSimplifyComponentTree(flowModel));
      }
    }
  }

  result.data = await FlowUtils.getResource(model as any);

  return result;
};

const handleSelect = (ctx: FlowModelContext, onAdd: (item: Omit<ContextItem, 'type'>) => void) => {
  dialogController.hide();
  aiSelection.startSelect('flow-model', {
    onSelect: ({ uid }) => {
      if (!uid) {
        return;
      }
      const model = ctx.engine.getModel(uid, true);
      if (!model) {
        return;
      }
      onAdd({
        uid,
        title: model.title ?? '',
      });
    },
  });
};

export const FlowModelsContext: WorkContextOptions = {
  name: 'flow-model',
  menu: {
    icon: <BuildOutlined />,
    Component: () => {
      const t = useT();
      return <div>{t('Pick block')}</div>;
    },
    onClick: ({ ctx, onAdd }) => handleSelect(ctx, onAdd),
  },
  tag: {
    Component: ({ item }) => {
      const flowEngine = useFlowEngine();
      const model = flowEngine.getModel(item.uid, true);
      return (
        <Space>
          <BuildOutlined />
          <span>{model?.title || item?.title || ''}</span>
        </Space>
      );
    },
  },
  getContent: async (app, { uid, content }) => {
    if (content) {
      return content;
    }
    const model = app.flowEngine.getModel(uid, true);
    if (!model) {
      return '';
    }
    return await parseFlowModel(model);
  },
};
