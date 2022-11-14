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
  getter({ type, options, onChange }) {
    const { t } = useWorkflowTranslation();
    const compile = useCompile();
    const { workflow } = useFlowContext();
    const { collections = [] } = useCollectionManager();
    const path = options?.path ? options.path.split('.') : [];
    const varOptions: any[] = [
      { value: 'date', label: t('Trigger time') },
    ];
    if (workflow.config.mode === SCHEDULE_MODE.COLLECTION_FIELD) {
      const collection = collections.find(item => item.name === workflow.config.collection) ?? { fields: [] };
      varOptions.push({
        value: 'data',
        label: t('Trigger data'),
        children: collection.fields
          .filter(field => BaseTypeSet.has(field?.uiSchema?.type))
          .map(field => ({
            value: field.name,
            label: compile(field.uiSchema?.title),
          }))
      });
    }
    return (
      <Cascader
        placeholder={t('Trigger context')}
        value={path}
        options={varOptions}
        onChange={(next) => {
          onChange({ type, options: { ...options, path: next.join('.') } });
        }}
        allowClear={false}
      />
    );
  }
};
