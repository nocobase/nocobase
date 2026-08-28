/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine, type SubModelItem } from '@nocobase/flow-engine';
import { getCollectionFieldOptions, type UseVariableOptions } from '../canvas/collectionFieldOptions';
import { getCollectionManagerAdapter, parseCollectionName } from '../components/collection';
import { useT } from '../locale';
import type { TempAssociationSource } from '../canvas/Instruction';

export type CollectionResultNodeLike = {
  id?: string | number;
  key: string;
  title?: string;
  config: {
    collection?: string;
    multiple?: boolean;
    params?: {
      appends?: string[];
    };
  };
};

export function useCollectionNodeVariables(
  { key: name, title, config }: CollectionResultNodeLike,
  options?: UseVariableOptions,
) {
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

export function getSingleRecordCreateModelMenuItem({
  node,
  title,
}: {
  node: CollectionResultNodeLike;
  title: string;
}): SubModelItem | null {
  if (!node.config.collection || node.config.multiple) {
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
            title,
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

export function getSingleRecordTempAssociationSource(node: CollectionResultNodeLike): TempAssociationSource | null {
  if (!node?.config?.collection || node.config.multiple || node.id == null) {
    return null;
  }
  return {
    collection: node.config.collection,
    nodeId: node.id,
    nodeKey: node.key,
    nodeType: 'node',
  };
}
