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
import { BuildOutlined, PicLeftOutlined, TableOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
// @ts-ignore
import { FlowEngine, FlowModel, useFlowEngine } from '@nocobase/flow-engine';
import _ from 'lodash';
import { aiSelection } from '../stores/ai-selection';
import { CollectionBlockModel, FieldModel, FormModel } from '@nocobase/client';
import { FlowUtils } from '../flow';

type SimplifyComponentNode = {
  uid: string;
  title: string;
  component: string;
  props?: Record<string, unknown>;
  children?: Record<string, SimplifyComponentNode[]>;
};

const parseFlowModel = (model: FlowModel) => {
  if (!model) {
    return {};
  }
  if (model instanceof FormModel) {
    return toSimplifyForm(model);
  } else {
    return toSimplifyComponentTree(model);
  }
};

const toSimplifyForm = (model: FormModel) => {
  const result = {
    uid: model.uid,
    fields: [],
  };
  const duplicateFields = new Set();
  FlowUtils.walkthrough(model, (model) => {
    if (model instanceof FieldModel && !duplicateFields.has(model.collectionField.name)) {
      const collectionField = model.collectionField;
      result.fields.push({
        name: collectionField.name,
        type: collectionField.type,
        title: collectionField.title,
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

const toSimplifyComponentTree = (model: FlowModel) => {
  const result: SimplifyComponentNode = {
    uid: model.uid,
    title: model.title,
    component: model.use,
  };

  if (model instanceof FieldModel) {
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
        result.children[key].push(toSimplifyComponentTree(flowModel));
      }
    }
  }

  return result;
};

const handleSelect = (flowEngine: FlowEngine, onAdd: (item: Omit<ContextItem, 'type'>) => void) => () => {
  aiSelection.startSelect('flow-model', {
    onSelect: ({ uid }) => {
      if (!uid) {
        return;
      }
      const model = flowEngine.getModel(uid);
      if (!model) {
        return;
      }
      onAdd({
        uid,
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
      return <div>{t('Select Block')}</div>;
    },
  },
  children: {
    field: {
      menu: {
        icon: <PicLeftOutlined />,
        Component: () => {
          const t = useT();
          return <div>{t('Fields')}</div>;
        },
        clickHandler: ({ flowEngine, onAdd }) => handleSelect(flowEngine, onAdd),
      },
      tag: {
        Component: ({ item }) => {
          const flowEngine = useFlowEngine();
          const model = flowEngine.getModel(item.uid);
          return (
            <>
              <PicLeftOutlined /> {model?.title || ''}
            </>
          );
        },
      },
      getContent: (app, { uid }) => {
        const model = app.flowEngine.getModel(uid);
        if (!model) {
          return '';
        }
        return JSON.stringify(parseFlowModel(model), undefined, 2);
      },
    },
    data: {
      menu: {
        icon: <TableOutlined />,
        Component: () => {
          const t = useT();
          return <div>{t('Data')}</div>;
        },
        clickHandler: ({ flowEngine, onAdd }) => handleSelect(flowEngine, onAdd),
      },
      tag: {
        Component: ({ item }) => {
          const flowEngine = useFlowEngine();
          const model = flowEngine.getModel(item.uid);
          return (
            <>
              <TableOutlined /> {model?.title || ''}
            </>
          );
        },
      },
      getContent: (app, { uid }) => {
        const model = app.flowEngine.getModel(uid);
        if (!model) {
          return '';
        }
        if (!(model instanceof CollectionBlockModel)) {
          return '';
        }
        const collection = FlowUtils.getCollection(model);
        const data = FlowUtils.getResource(model);
        return JSON.stringify(
          {
            collection: {
              ...collection,
              data,
            },
          },
          undefined,
          2,
        );
      },
    },
  },
};
