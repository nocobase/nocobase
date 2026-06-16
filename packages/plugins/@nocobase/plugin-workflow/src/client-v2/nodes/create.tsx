/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FileAddOutlined } from '@ant-design/icons';
import { useFlowEngine, type SubModelItem } from '@nocobase/flow-engine';
import { getCollectionFieldOptions, type UseVariableOptions } from '../canvas/collectionFieldOptions';
import { Instruction } from '../canvas/Instruction';
import { getCollectionManagerAdapter, parseCollectionName } from '../components/collection';
import { NAMESPACE } from '../locale';
import { useT } from '../locale';

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

type CreateNodeLike = {
  id?: string | number;
  key: string;
  title?: string;
  config: {
    collection?: string;
    params?: {
      appends?: string[];
    };
  };
};

function useVariables({ key: name, title, config }: CreateNodeLike, options?: UseVariableOptions) {
  const flowEngine = useFlowEngine();
  const compile = useT();
  if (!config.collection) {
    return null;
  }
  const [dataSourceName, collection] = parseCollectionName(config.collection) as [string, string];
  const collectionManager = getCollectionManagerAdapter(flowEngine.context.dataSourceManager, dataSourceName);
  const [result] = getCollectionFieldOptions({
    appends: [name, ...(config.params?.appends?.map((item) => `${name}.${item}`) || [])],
    ...options,
    fields: [
      {
        collectionName: collection,
        name,
        type: 'hasOne',
        target: collection,
        uiSchema: {
          title,
        },
      },
    ],
    compile,
    collectionManager,
  });

  return result;
}

export default class extends Instruction {
  type = 'create';
  title = t('Create record');
  group = 'collection';
  description = t(
    'Add new record to a collection. You can use variables from upstream nodes to assign values to fields.',
  );
  icon = (<FileAddOutlined />);

  FieldsetLoader = () => import('./components/create').then((m) => ({ default: m.CreateFieldset }));
  PresetFieldsetLoader = () => import('./components/create').then((m) => ({ default: m.CreatePresetFieldset }));

  createDefaultConfig() {
    return {
      usingAssignFormSchema: true,
      assignFormSchema: {},
    };
  }

  useVariables = useVariables;

  getCreateModelMenuItem({ node }: { node: CreateNodeLike }): SubModelItem | null {
    if (!node.config.collection) {
      return null;
    }
    const [dataSourceKey, collectionName] = parseCollectionName(node.config.collection) as [string, string];
    if (!dataSourceKey || !collectionName) {
      return null;
    }

    return {
      key: node.title ?? `#${node.id}`,
      label: node.title ?? `#${node.id}`,
      useModel: 'NodeDetailsModel',
      createModelOptions: {
        use: 'NodeDetailsModel',
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey,
              collectionName,
              dataPath: `$jobsMapByNodeKey.${node.key}`,
            },
          },
          cardSettings: {
            titleDescription: {
              title: t('Create record'),
            },
          },
        },
        subModels: {
          grid: {
            use: 'NodeDetailsGridModel',
            subType: 'object',
          },
        },
      },
    };
  }

  useTempAssociationSource(node: CreateNodeLike) {
    if (!node?.config?.collection || node.id == null) {
      return null;
    }
    return {
      collection: node.config.collection,
      nodeId: node.id,
      nodeKey: node.key,
      nodeType: 'node' as const,
    };
  }
}
