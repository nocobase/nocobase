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
import { CONTEXT_TYPE, EVENT_TYPE } from '../../common/constants';
import { NAMESPACE, useT } from '../locale';

type CustomActionTriggerConfig = {
  type?: number | null;
  collection?: string;
  appends?: string[];
  global?: boolean;
};

function getParsedCollection(collection?: string): { dataSourceKey: string; collectionName?: string } {
  const [dataSourceKey = 'main', collectionName] = parseCollectionName(collection) as [string, string];
  return { dataSourceKey, collectionName };
}

function useVariables(config: CustomActionTriggerConfig, options?: UseVariableOptions): VariableOption[] {
  const flowEngine = useFlowEngine();
  const t = useT();
  const { dataSourceKey, collectionName } = getParsedCollection(config.collection);
  const mainCollectionManager = getCollectionManagerAdapter(flowEngine.context.dataSourceManager, 'main');
  const collectionManager = getCollectionManagerAdapter(flowEngine.context.dataSourceManager, dataSourceKey);
  const userFields = getCollectionFieldOptions({
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
    ],
    compile: t,
    collectionManager: mainCollectionManager,
  });

  if (config.global || config.type === CONTEXT_TYPE.GLOBAL || !config.collection || !collectionName) {
    return [
      {
        label: t('Trigger data'),
        value: 'data',
      },
      ...userFields,
      {
        label: t('Role of user acted'),
        value: 'roleName',
      },
    ];
  }

  return [
    ...getCollectionFieldOptions({
      appends: ['data', ...(config.appends?.map((item) => `data.${item}`) || [])],
      ...options,
      fields: [
        {
          collectionName,
          name: 'data',
          type: 'hasOne',
          target: collectionName,
          uiSchema: {
            title: t('Trigger data'),
          },
        },
      ],
      compile: t,
      collectionManager,
    }),
    ...userFields,
    {
      label: t('Role of user acted'),
      value: 'roleName',
    },
  ];
}

export class CustomActionTrigger extends Trigger {
  title = `{{t("Custom action event", { ns: "${NAMESPACE}" })}}`;
  description = `{{t('When the "Trigger Workflow" button is clicked, the event is triggered based on different context where the button is located. For complex data processing that cannot be handled simply by built-in operations (CRUD) of NocoBase, you can define a series of operations through a workflow and trigger it with the "Trigger Workflow" button.', { ns: "${NAMESPACE}" })}}`;
  sync = false;

  PresetFieldsetLoader: TriggerLoaderOf = () =>
    import('./CustomActionTriggerConfig').then((module) => ({ default: module.CustomActionTriggerPresetConfig }));
  FieldsetLoader: TriggerLoaderOf = () => import('./CustomActionTriggerConfig');
  TriggerFieldsetLoader: TriggerLoaderOf = () => import('./TriggerCustomActionConfig');

  createDefaultConfig() {
    return {
      type: CONTEXT_TYPE.GLOBAL,
    };
  }

  validate(values: CustomActionTriggerConfig) {
    return (
      !values.type ||
      values.type === CONTEXT_TYPE.GLOBAL ||
      ([CONTEXT_TYPE.SINGLE_RECORD, CONTEXT_TYPE.MULTIPLE_RECORDS].includes(values.type) && Boolean(values.collection))
    );
  }

  isActionTriggerable_deprecated = (config: CustomActionTriggerConfig, context: { buttonAction?: string }) => {
    return context.buttonAction === 'customize:triggerWorkflows' && config.type === CONTEXT_TYPE.SINGLE_RECORD;
  };

  useVariables = useVariables;

  getCreateModelMenuItem({ config }: { config: CustomActionTriggerConfig }): SubModelItem | null {
    if (!config.collection) {
      return null;
    }

    const { dataSourceKey, collectionName } = getParsedCollection(config.collection);
    if (!collectionName) {
      return null;
    }

    return {
      key: 'triggerData',
      label: `{{t("Trigger data", { ns: "workflow" })}}`,
      useModel: 'NodeDetailsModel',
      createModelOptions: {
        use: 'NodeDetailsModel',
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey,
              collectionName,
              dataPath: '$context.data',
            },
          },
          cardSettings: {
            titleDescription: {
              title: `{{t("Trigger data", { ns: "workflow" })}}`,
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
}

export { EVENT_TYPE };
