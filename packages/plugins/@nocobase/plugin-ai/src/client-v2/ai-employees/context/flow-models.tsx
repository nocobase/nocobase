/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { BuildOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import { BlockModel, CollectionBlockModel, FormBlockModel, FormItemModel } from '@nocobase/client-v2';
import type { FlowEngineContext, FlowModel } from '@nocobase/flow-engine';
import { MultiRecordResource, useFlowEngine } from '@nocobase/flow-engine';
import { UploadFieldModel } from '@nocobase/plugin-file-manager/client-v2';
import type { ContextItem, WorkContextOptions } from '../types';
import { useT } from '../../locale';
import { FlowUtils } from '../flow';
import { aiSelection } from '../stores/ai-selection';
import { dialogController } from '../stores/dialog-controller';

type SimplifyComponentNode = {
  uid: string;
  title: string;
  component: string;
  props?: Record<string, unknown>;
  children?: Record<string, SimplifyComponentNode[]>;
  data?: unknown;
};

type CollectionLike = {
  name?: string;
  title?: string;
  fields?: unknown;
  [key: string]: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const parseFlowModel = async (model: FlowModel) => {
  if (!model) {
    return {};
  }
  if (model instanceof FormBlockModel) {
    return toSimplifyForm(model);
  }
  if (model instanceof CollectionBlockModel) {
    return toCollection(model);
  }
  return toSimplifyComponentTree(model);
};

const toSimplifyForm = (model: FormBlockModel) => {
  const result: {
    uid: string;
    fields: unknown[];
    value: unknown;
  } = {
    uid: model.uid,
    fields: [],
    value: undefined,
  };
  const duplicateFields = new Set<string>();
  const excludeFieldValues = new Set<string>();

  FlowUtils.walkthrough(model, (subModel) => {
    if (subModel instanceof FormItemModel && subModel.collectionField?.name) {
      const collectionField = subModel.collectionField;
      if (!duplicateFields.has(collectionField.name)) {
        result.fields.push({
          name: collectionField.name,
          type: collectionField.type,
          enum: collectionField.enum,
          readonly: collectionField.readonly,
          defaultValue: collectionField.defaultValue,
        });
        duplicateFields.add(collectionField.name);
      }
    }
    if (
      subModel instanceof UploadFieldModel &&
      subModel.props?.value?.length &&
      typeof subModel.props.value !== 'string'
    ) {
      const name = typeof subModel.props.name === 'string' ? subModel.props.name : undefined;
      if (name) {
        excludeFieldValues.add(name);
      }
    }
  });

  if (model.form) {
    result.value = model.form.getFieldsValue(true, (meta) => {
      const firstName = Array.isArray(meta.name) ? meta.name[0] : undefined;
      return typeof firstName === 'string' ? !excludeFieldValues.has(firstName) : true;
    });
  }
  return result;
};

const toCollection = async (model: CollectionBlockModel) => {
  const collection = readCollection(model);
  const resource = (model as unknown as { resource?: unknown }).resource;
  if (resource instanceof MultiRecordResource) {
    return {
      dataScope: {
        filter: resource.getFilter(),
      },
      collection,
      prompt: `Before querying, first call getSkill with skillName="data-query" to load the data-query skill and make dataSourceQuery and dataSourceCounting available.
Always apply dataScope.filter when calling dataSourceQuery or dataSourceCounting.`,
    };
  }
  return {
    collection,
    data: await readResourceData(model),
  };
};

const toSimplifyComponentTree = async (model: FlowModel): Promise<SimplifyComponentNode> => {
  const result: SimplifyComponentNode = {
    uid: model.uid,
    title: model.title,
    component: model.use,
  };

  if (model instanceof FormItemModel && model.collectionField) {
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
      const flowModels = Array.isArray(value) ? value : [value];
      for (const flowModel of flowModels) {
        result.children[key].push(await toSimplifyComponentTree(flowModel));
      }
    }
  }

  result.data = await readResourceData(model);
  return result;
};

const readCollection = (model: CollectionBlockModel): CollectionLike | undefined => {
  const collection = model.collection;
  if (!collection) {
    return undefined;
  }
  return {
    name: collection.name,
    title: collection.title,
    fields: typeof collection.getFields === 'function' ? collection.getFields() : undefined,
  };
};

const readResourceData = async (model: FlowModel) => {
  const resource = (model as unknown as { resource?: { getData?: () => unknown; refresh?: () => Promise<unknown> } })
    .resource;
  if (!resource) {
    return undefined;
  }
  const data = resource.getData?.();
  if (data !== undefined) {
    return data;
  }
  await resource.refresh?.();
  return resource.getData?.();
};

const handleSelect = (ctx: FlowEngineContext, onAdd: (item: Omit<ContextItem, 'type'>) => void) => {
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
    return parseFlowModel(model);
  },
};

BlockModel.registerFlow({
  key: 'aiOnSelectSettings',
  steps: {
    aiOnSelect: {
      handler(ctx) {
        const { className, onClick } = ctx.model.decoratorProps;
        ctx.model.setDecoratorProps({
          className: ['ai-selectable', className].filter(Boolean).join(' '),
          'data-uid': ctx.model.uid,
          onClick: (event: React.MouseEvent) => {
            onClick?.(event);
            if (!aiSelection.selectable) {
              return;
            }
            aiSelection.selector?.onSelect({ uid: ctx.model.uid });
            aiSelection.stopSelect();
            dialogController.resume();
          },
        });
      },
    },
  },
});
