import React from 'react';
import { Cascader } from 'antd';

import { useCompile, useCollectionDataSource, useCollectionManager } from '@nocobase/client';

import { ScheduleConfig } from './ScheduleConfig';
import { useFlowContext } from '../../FlowContext';
import { BaseTypeSet } from '../../calculators';
import { SCHEDULE_MODE } from './constants';
import { NAMESPACE, useWorkflowTranslation } from '../../locale';

export default {
  title: `{{t("Schedule event", { ns: "${NAMESPACE}" })}}`,
  type: 'schedule',
  fieldset: {
    config: {
      type: 'object',
      name: 'config',
      'x-component': 'ScheduleConfig',
      'x-component-props': {
      }
    }
  },
  scope: {
    useCollectionDataSource
  },
  components: {
    ScheduleConfig
  },
  getOptions(config) {
    const { t } = useWorkflowTranslation();
    const options: any[] = [
      { value: 'date', label: t('Trigger time') },
    ];
    if (config.mode === SCHEDULE_MODE.COLLECTION_FIELD) {
      options.push({
        value: 'data',
        label: t('Trigger data')
      });
    }
    return options;
  },
  getter({ type, options, onChange }) {
    const { t } = useWorkflowTranslation();
    const compile = useCompile();
    const { collections = [] } = useCollectionManager();
    const { workflow } = useFlowContext();
    const path = options?.path ? options.path.split('.') : [];
    if (!options.type || options.type === 'date') {
      return null;
    }
    const collection = collections.find(item => item.name === workflow.config.collection) ?? { fields: [] };
    return (
      <Cascader
        placeholder={t('Trigger data')}
        value={path}
        options={collection.fields
          .filter(field => BaseTypeSet.has(field?.uiSchema?.type))
          .map(field => ({
            value: field.name,
            label: compile(field.uiSchema?.title),
          }))}
        onChange={(next) => {
          onChange({ type, options: { ...options, path: next.join('.') } });
        }}
        allowClear={false}
      />
    );
  }
};
