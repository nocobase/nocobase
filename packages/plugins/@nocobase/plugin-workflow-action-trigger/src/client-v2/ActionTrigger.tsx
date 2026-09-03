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
  getCollectionManagerAdapter,
  parseCollectionName,
  Trigger,
  type TriggerLoaderOf,
  type UseVariableOptions,
  type VariableOption,
} from '@nocobase/plugin-workflow/client-v2';

import { NAMESPACE, useT } from './locale';

export const COLLECTION_TRIGGER_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  UPSERT: 'updateOrCreate',
  DESTROY: 'destroy',
} as const;

type ActionTriggerConfigValue = {
  collection?: string;
  appends?: string[];
  global?: boolean;
};

function useActionTriggerVariables(config: Record<string, unknown>, options?: UseVariableOptions): VariableOption[] {
  const flowEngine = useFlowEngine();
  const t = useT();
  const actionConfig = config as ActionTriggerConfigValue;
  const [dataSourceName, collection] = parseCollectionName(actionConfig.collection) as [string, string];
  const collectionManager = getCollectionManagerAdapter(flowEngine.context.dataSourceManager, dataSourceName);
  const mainCollectionManager = getCollectionManagerAdapter(flowEngine.context.dataSourceManager);

  return [
    ...getCollectionFieldOptions({
      appends: ['data', ...(actionConfig.appends?.map((item) => `data.${item}`) || [])],
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
    }),
    ...getCollectionFieldOptions({
      appends: ['user'],
      ...options,
      fields: [
        {
          collectionName: 'users',
          name: 'user',
          type: 'hasOne',
          target: 'users',
          uiSchema: {
            title: t('User acted'),
          },
        },
        {
          name: 'roleName',
          uiSchema: {
            title: t('Role of user acted'),
          },
        },
      ],
      compile: t,
      collectionManager: mainCollectionManager,
    }),
  ];
}

export default class ActionTrigger extends Trigger {
  title = `{{t("Post-action event", { ns: "${NAMESPACE}" })}}`;
  description = `{{t('Triggered after the completion of a request initiated through an action button or API, such as after adding or updating data. Suitable for data processing, sending notifications, etc., after actions are completed.', { ns: "${NAMESPACE}" })}}`;

  PresetFieldsetLoader: TriggerLoaderOf = () =>
    import('./ActionTriggerConfig').then((module) => ({ default: module.ActionTriggerPresetConfig }));
  FieldsetLoader: TriggerLoaderOf = () => import('./ActionTriggerConfig');
  TriggerFieldsetLoader: TriggerLoaderOf = () => import('./TriggerActionConfig');

  validate(config: Record<string, unknown>) {
    return Boolean((config as ActionTriggerConfigValue).collection);
  }

  isActionTriggerable_deprecated = (config: Record<string, unknown>, context: { buttonAction?: string }) => {
    return !config.global && ['submit', 'customize:save', 'customize:update'].includes(context.buttonAction || '');
  };

  actionTriggerableScope = (config: Record<string, unknown>, scope: string) => {
    return !config.global && ['form'].includes(scope);
  };

  useVariables = useActionTriggerVariables;

  getCreateModelMenuItem({ config }: { config: Record<string, unknown> }): SubModelItem | null {
    const actionConfig = config as ActionTriggerConfigValue;
    if (!actionConfig?.collection) {
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
              collectionName: actionConfig.collection,
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

  useTempAssociationSource(config: Record<string, unknown>, workflow?: { id?: string | number }) {
    const actionConfig = config as ActionTriggerConfigValue;
    if (!actionConfig?.collection || !workflow?.id) {
      return null;
    }
    return {
      collection: actionConfig.collection,
      nodeId: workflow.id,
      nodeKey: 'workflow',
      nodeType: 'workflow' as const,
    };
  }
}
