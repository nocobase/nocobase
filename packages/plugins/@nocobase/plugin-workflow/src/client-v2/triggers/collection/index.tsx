/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine, type SubModelItem } from '@nocobase/flow-engine';
import {
  getCollectionFieldOptions,
  type UseVariableOptions,
  type VariableOption,
} from '../../canvas/collectionFieldOptions';
import { getCollectionManagerAdapter, parseCollectionName } from '../../components/collection';
import { NAMESPACE, useT } from '../../locale';
import { Trigger, type LoaderOf } from '..';

export default class CollectionTrigger extends Trigger {
  title = `{{t("Collection event", { ns: "${NAMESPACE}" })}}`;
  description = `{{t('Triggered when data changes in the collection, such as after adding, updating, or deleting a record. Unlike "Post-action event", Collection event listens for data changes rather than HTTP requests. Unless you understand the exact meaning, it is recommended to use "Post-action event".', { ns: "${NAMESPACE}" })}}`;

  PresetFieldsetLoader: LoaderOf = () => import('./CollectionConfig');
  FieldsetLoader: LoaderOf = () => import('./CollectionConfig');
  TriggerFieldsetLoader: LoaderOf = () => import('./TriggerCollectionConfig');

  validate(config: Record<string, unknown>) {
    return Boolean(config?.collection && config?.mode);
  }

  useVariables = useVariables;

  getCreateModelMenuItem({ config }: { config: { collection?: string } }): SubModelItem | null {
    if (!config?.collection) {
      return null;
    }

    return {
      key: 'triggerData',
      label: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
      useModel: 'NodeDetailsModel',
      createModelOptions: {
        use: 'NodeDetailsModel',
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: config.collection,
              dataPath: '$context.data',
            },
          },
          cardSettings: {
            titleDescription: {
              title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
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

  useTempAssociationSource(config: { collection?: string }, workflow?: { id?: string | number }) {
    if (!config?.collection || !workflow?.id) {
      return null;
    }
    return {
      collection: config.collection,
      nodeId: workflow.id,
      nodeKey: 'workflow',
      nodeType: 'workflow' as const,
    };
  }
}

function useVariables(
  config: { collection?: string; appends?: string[] },
  options?: UseVariableOptions,
): VariableOption[] {
  const flowEngine = useFlowEngine();
  const t = useT();
  const [dataSourceName, collection] = parseCollectionName(config.collection) as [string, string];
  const collectionManager = getCollectionManagerAdapter(flowEngine.context.dataSourceManager, dataSourceName);

  return getCollectionFieldOptions({
    appends: ['data', ...(config.appends?.map((item) => `data.${item}`) || [])],
    ...options,
    fields: [
      {
        collectionName: collection,
        name: 'data',
        type: 'hasOne',
        target: collection,
        uiSchema: {
          title: t('Trigger data'),
        },
      },
    ],
    compile: t,
    collectionManager,
  });
}
