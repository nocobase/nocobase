/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
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

import { INTERCEPTABLE_ACTIONS } from '../common/constants';
import { NAMESPACE, useT } from './locale';

type RequestInterceptionConfigValue = {
  collection?: string;
  action?: string;
  global?: boolean;
};

function useActionParamVariables(
  config: RequestInterceptionConfigValue,
  options?: UseVariableOptions,
): VariableOption[] {
  const flowEngine = useFlowEngine();
  const t = useT();
  const [dataSourceName] = parseCollectionName(config.collection) as [string, string];
  const collectionManager = getCollectionManagerAdapter(flowEngine.context.dataSourceManager, dataSourceName);
  const variables: VariableOption[] = [
    {
      label: t('ID'),
      value: 'filterByTk',
    },
  ];

  if (config.collection && config.action !== INTERCEPTABLE_ACTIONS.DESTROY) {
    variables.push({
      label: t('Values submitted'),
      value: 'values',
      children: getCollectionFieldOptions({
        ...options,
        appends: null,
        depth: 3,
        collection: config.collection,
        compile: t,
        collectionManager,
      }),
    });
  }

  return variables;
}

function useVariables(config: Record<string, unknown>, options?: UseVariableOptions): VariableOption[] {
  const flowEngine = useFlowEngine();
  const t = useT();
  const requestConfig = config as RequestInterceptionConfigValue;
  const collectionManager = getCollectionManagerAdapter(flowEngine.context.dataSourceManager);
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
      {
        name: 'roleName',
        uiSchema: {
          title: t('Role of user acted'),
        },
      },
    ],
    compile: t,
    collectionManager,
  });

  return [
    ...userFields,
    {
      label: t('Parameters'),
      value: 'params',
      children: useActionParamVariables(requestConfig, options),
    },
  ];
}

export default class RequestInterceptionTrigger extends Trigger {
  sync = true;
  title = `{{t("Pre-action event", { ns: "${NAMESPACE}" })}}`;
  description = `{{t('Triggered before the execution of a request initiated through an action button or API, such as before adding, updating, or deleting data. Suitable for data validation and logic judgment before action, and the request could be rejected by using the "End process" node.', { ns: "${NAMESPACE}" })}}`;

  PresetFieldsetLoader: TriggerLoaderOf = () =>
    import('./RequestInterceptionTriggerConfig').then((module) => ({
      default: module.RequestInterceptionTriggerPresetConfig,
    }));
  FieldsetLoader: TriggerLoaderOf = () => import('./RequestInterceptionTriggerConfig');
  TriggerFieldsetLoader: TriggerLoaderOf = () => import('./TriggerRequestInterceptionConfig');

  validate(config: Record<string, unknown>) {
    return Boolean((config as RequestInterceptionConfigValue).collection);
  }

  isActionTriggerable_deprecated = (config: Record<string, unknown>, context: { buttonAction?: string }) => {
    return (
      !config.global && ['submit', 'customize:save', 'customize:update', 'destroy'].includes(context.buttonAction || '')
    );
  };

  actionTriggerableScope = (config: Record<string, unknown>, scope: string) => {
    return !config.global && ['form'].includes(scope);
  };

  useVariables = useVariables;

  getCreateModelMenuItem({ config }: { config: Record<string, unknown> }): SubModelItem | null {
    const requestConfig = config as RequestInterceptionConfigValue;
    if (!requestConfig?.collection) {
      return null;
    }

    return {
      key: 'triggerData',
      label: '{{t("Trigger data", { ns: "workflow" })}}',
      useModel: 'NodeDetailsModel',
      createModelOptions: {
        use: 'NodeDetailsModel',
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: requestConfig.collection,
              dataPath: '$context.params.values',
            },
          },
          cardSettings: {
            titleDescription: {
              title: '{{t("Trigger data", { ns: "workflow" })}}',
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
    const requestConfig = config as RequestInterceptionConfigValue;
    if (!requestConfig?.collection || !workflow?.id) {
      return null;
    }
    return {
      collection: requestConfig.collection,
      nodeId: workflow.id,
      nodeKey: 'workflow',
      nodeType: 'workflow' as const,
    };
  }
}
