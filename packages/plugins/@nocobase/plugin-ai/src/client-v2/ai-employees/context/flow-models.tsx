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

type CollectionBlockLike = FlowModel & {
  collection?: {
    name?: string;
    title?: string;
    getFields?: () => unknown;
  };
  resource?: unknown;
};

const collectionQueryPrompt = `Before querying, first call getSkill with skillName="data-query" to load the data-query skill and make dataSourceQuery and dataSourceCounting available.
After the skill is loaded, use dataSourceQuery to query data from a data source and dataSourceCounting to get record counts.
When analyzing user messages, if any words or phrases are related or similar to a known collectionName, prioritize retrieving relevant data before responding.
When the user asks about quantities, totals, or record counts, you must first call dataSourceCounting to obtain accurate numbers before answering.
Always apply dataScope.filter when calling dataSourceQuery or dataSourceCounting. Ensure that the filter structure is properly transformed to match the tools’ input format.
Do not mention or reveal any details about tools, data sources, or internal processes in your reply.
Unless the user explicitly requests it, do not directly output large amounts of raw data—summarize, filter, or aggregate the results naturally in your response.`;

const hasCollectionResource = (model: FlowModel): model is CollectionBlockLike => {
  return !!Reflect.get(model, 'collection') || !!Reflect.get(model, 'resource');
};

const parseFlowModel = async (model: FlowModel) => {
  if (!model) {
    return {};
  }
  if (model instanceof FormBlockModel) {
    return toSimplifyForm(model);
  }
  if (model instanceof CollectionBlockModel || hasCollectionResource(model)) {
    return toCollection(model as unknown as CollectionBlockLike);
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

const toCollection = async (model: CollectionBlockLike) => {
  const collection = readCollection(model);
  const resource = Reflect.get(model, 'resource');
  if (isMultiRecordResource(resource)) {
    return {
      dataScope: {
        filter: resource.getFilter?.(),
      },
      collection,
      prompt: collectionQueryPrompt,
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

const readCollection = (model: CollectionBlockLike): CollectionLike | undefined => {
  const collection = Reflect.get(model, 'collection') as CollectionBlockLike['collection'];
  if (!collection) {
    return undefined;
  }
  const fields =
    typeof collection.getFields === 'function' ? simplifyCollectionFields(collection.getFields()) : undefined;
  return {
    name: collection.name,
    title: collection.title,
    fields,
  };
};

const simplifyCollectionFields = (fields: unknown): unknown[] | undefined => {
  const values = fields instanceof Map ? Array.from(fields.values()) : Array.isArray(fields) ? fields : undefined;
  if (!values) {
    return undefined;
  }
  return values.map((field) => {
    if (!field || typeof field !== 'object') {
      return field;
    }
    const record = field as Record<string, unknown>;
    const targetCollection = safeGet<{ name?: string }>(record, 'targetCollection');
    return {
      name: safeGet(record, 'name'),
      type: safeGet(record, 'type'),
      title: safeGet(record, 'title'),
      interface: safeGet(record, 'interface'),
      dataType: safeGet(record, 'dataType'),
      target: safeGet(record, 'target'),
      targetKey: safeGet(record, 'targetKey'),
      targetCollection: targetCollection?.name,
      enum: safeGet(record, 'enum'),
      readonly: safeGet(record, 'readonly'),
      defaultValue: safeGet(record, 'defaultValue'),
    };
  });
};

const safeGet = <T = unknown,>(record: Record<string, unknown>, key: string): T | undefined => {
  try {
    return record[key] as T;
  } catch {
    return undefined;
  }
};

const isMultiRecordResource = (resource: unknown): resource is MultiRecordResource & { getFilter?: () => unknown } => {
  if (resource instanceof MultiRecordResource) {
    return true;
  }
  return (
    !!resource &&
    typeof resource === 'object' &&
    ((resource as { constructor?: { name?: string } }).constructor?.name === 'MultiRecordResource' ||
      typeof (resource as { getFilter?: unknown }).getFilter === 'function')
  );
};

const getFallbackCollection = (model: FlowModel, resource: unknown): CollectionLike => {
  const resourceName =
    resource && typeof resource === 'object' ? (resource as { resourceName?: string }).resourceName : undefined;
  return {
    name: resourceName,
    title: model.title,
  };
};

const readResourceData = async (model: FlowModel) => {
  const resource = Reflect.get(model, 'resource') as
    | { getData?: () => unknown; refresh?: () => Promise<unknown> }
    | undefined;
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

const stringifyFlowModelContent = (content: unknown) => {
  if (typeof content === 'string') {
    return content;
  }
  try {
    const serializable = toSerializable(content, new WeakSet<object>());
    return JSON.stringify(serializable, null, 2);
  } catch {
    return content && typeof content === 'object' ? '{}' : String(content ?? '');
  }
};

const toSerializable = (value: unknown, seen: WeakSet<object>): unknown => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'undefined') {
    return undefined;
  }
  if (value == null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (seen.has(value)) {
    return undefined;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => {
      try {
        return toSerializable(item, seen);
      } catch {
        return undefined;
      }
    });
  }
  if (value instanceof Map) {
    try {
      return Object.fromEntries(
        Array.from(value.entries()).map(([key, mapValue]) => [String(key), toSerializable(mapValue, seen)]),
      );
    } catch {
      return {};
    }
  }
  if (value instanceof Set) {
    try {
      return Array.from(value.values()).map((item) => toSerializable(item, seen));
    } catch {
      return [];
    }
  }

  const result: Record<string, unknown> = {};
  let keys: string[];
  try {
    keys = Object.keys(value);
  } catch {
    return result;
  }
  keys.forEach((key) => {
    let child: unknown;
    try {
      child = (value as Record<string, unknown>)[key];
    } catch {
      return;
    }
    let serializableChild: unknown;
    try {
      serializableChild = toSerializable(child, seen);
    } catch {
      return;
    }
    if (typeof serializableChild !== 'undefined') {
      result[key] = serializableChild;
    }
  });
  return result;
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
      return stringifyFlowModelContent(content);
    }
    const model = app.flowEngine.getModel(uid, true);
    if (!model) {
      return '';
    }
    const collectionModel = model as unknown as CollectionBlockLike;
    const collection = readCollection(collectionModel);
    const resource = Reflect.get(collectionModel, 'resource');
    if (collection || resource) {
      if (isMultiRecordResource(resource)) {
        return stringifyFlowModelContent({
          dataScope: {
            filter: resource.getFilter?.(),
          },
          collection: collection ?? getFallbackCollection(model, resource),
          prompt: collectionQueryPrompt,
        });
      }
      return stringifyFlowModelContent({
        collection: collection ?? getFallbackCollection(model, resource),
        data: await readResourceData(collectionModel),
      });
    }
    const parsed = await parseFlowModel(model);
    const parsedContent = stringifyFlowModelContent(parsed);
    if (parsedContent === '{}') {
      return stringifyFlowModelContent({
        uid: model.uid,
        title: model.title,
        component: model.use,
        props: model.props,
      });
    }
    return parsedContent;
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
