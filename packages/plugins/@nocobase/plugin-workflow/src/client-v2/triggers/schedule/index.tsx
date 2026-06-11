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
import { NAMESPACE, useT } from '../../locale';
import { Trigger, type LoaderOf } from '..';
import { getCollectionManagerAdapter, parseCollectionName } from './collectionUtils';
import { ScheduleModes, type ScheduleConfigValue } from './ScheduleModes';
import { SCHEDULE_MODE } from './constants';

function useVariables(config: ScheduleConfigValue, opts?: UseVariableOptions): VariableOption[] {
  const flowEngine = useFlowEngine();
  const t = useT();
  const [dataSourceName] = parseCollectionName(config.collection) as [string, string];
  const collectionManager = getCollectionManagerAdapter(flowEngine.context.dataSourceManager, dataSourceName);
  const options: VariableOption[] = [];

  if (!opts?.types || opts.types.includes('date')) {
    options.push({ key: 'date', value: 'date', label: t('Trigger time') });
  }

  if (config.mode === SCHEDULE_MODE.DATE_FIELD && config.collection) {
    const [fieldOption] = getCollectionFieldOptions({
      appends: ['data', ...(config.appends?.map((item) => `data.${item}`) || [])],
      ...opts,
      fields: [
        {
          collectionName: config.collection,
          name: 'data',
          type: 'hasOne',
          target: config.collection,
          uiSchema: {
            title: t('Trigger data'),
          },
        },
      ],
      compile: t,
      collectionManager,
    });
    if (fieldOption) {
      options.push(fieldOption);
    }
  }

  return options;
}

export default class ScheduleTrigger extends Trigger {
  sync = false;
  title = `{{t("Schedule event", { ns: "${NAMESPACE}" })}}`;
  description = `{{t("Triggered according to preset time conditions. Suitable for one-time or periodic tasks, such as sending notifications and cleaning data on a schedule.", { ns: "${NAMESPACE}" })}}`;

  PresetFieldsetLoader: LoaderOf = () => import('./CreateConfigForm');
  FieldsetLoader: LoaderOf<{ modeDisabled?: boolean }> = () => import('./ScheduleConfig');
  TriggerFieldsetLoader: LoaderOf = () => import('./TriggerScheduleConfig');

  createDefaultConfig() {
    return { mode: SCHEDULE_MODE.STATIC };
  }

  validate(config: ScheduleConfigValue) {
    if (config.mode == null) {
      return false;
    }
    const { validate } = ScheduleModes[config.mode];
    return validate ? Boolean(validate(config)) : true;
  }

  useVariables = useVariables;

  getCreateModelMenuItem({ config }: { config: ScheduleConfigValue }): SubModelItem | null {
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

  useTempAssociationSource(config: ScheduleConfigValue, workflow?: { id?: string | number }) {
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
