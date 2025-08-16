/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { WorkContextOptions } from '../types';
import { BuildOutlined, StarOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
import { tval } from '@nocobase/utils/client';
// @ts-ignore
import pkg from '../../../../package.json';
import { useFlowEngine } from '@nocobase/flow-engine';
import _ from 'lodash';
import { aiSelection } from '../stores/ai-selection';

function parseModel(node: any) {
  if (!node || typeof node !== 'object' || !node.uid || !node.use) return null;

  const parsed = {
    uid: node.uid,
    use: node.use,
    props: node.props || {},
    decoratorProps: node.decoratorProps || {},
    stepParams: node.stepParams || {},
    collectionField: node.collectionField
      ? _.pick(node.collectionField, ['dataSourceKey', 'enum', 'name', 'type', 'title', 'uiSchema'])
      : {},
    children: {},
  };

  if (node.subModels && typeof node.subModels === 'object') {
    for (const key in node.subModels) {
      const group = node.subModels[key];
      if (Array.isArray(group)) {
        parsed.children[key] = group.map((sub) => parseModel(sub)).filter(Boolean);
      } else if (typeof group === 'object') {
        const child = parseModel(group);
        if (child) {
          parsed.children[key] = [child];
        }
      }
    }
  }

  return parsed;
}

export const FlowModelsContext: WorkContextOptions = {
  name: 'flow-model',
  menu: {
    icon: <BuildOutlined />,
    Component: ({ onAdd }) => {
      const t = useT();
      const flowEngine = useFlowEngine();
      return (
        <div
          onClick={() => {
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
          }}
        >
          {t('Select block')}
        </div>
      );
    },
  },
  tag: {
    Component: ({ item }) => {
      const flowEngine = useFlowEngine();
      const model = flowEngine.getModel(item.uid);
      return (
        <>
          <BuildOutlined /> {model?.title || ''}
        </>
      );
    },
  },
  getContent: (app, { uid }) => {
    const model = app.flowEngine.getModel(uid);
    if (!model) {
      return '';
    }
    return JSON.stringify(parseModel(model));
  },
};
