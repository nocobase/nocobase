import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from 'antd';

import { useCompile, useCollectionDataSource, useCollectionManager } from '@nocobase/client';

import { ScheduleConfig } from './ScheduleConfig';
import { useFlowContext } from '../../WorkflowCanvas';
import { BaseTypeSet } from '../../calculators';

export default {
  title: '{{t("Schedule event")}}',
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
    const { t } = useTranslation();
    const compile = useCompile();
    const { collections = [] } = useCollectionManager();
    const { workflow } = useFlowContext();
    const collection = collections.find(item => item.name === workflow.config.collection) ?? { fields: [] };

    return (
      <Select
        placeholder={t('Fields')}
        value={options?.path?.replace(/^data\./, '')}
        onChange={(path) => {
          onChange({ type, options: { ...options, path: `data.${path}` } });
        }}
      >
        {collection.fields
          .filter(field => BaseTypeSet.has(field?.uiSchema?.type))
          .map(field => (
          <Select.Option key={field.name} value={field.name}>{compile(field.uiSchema.title)}</Select.Option>
        ))}
      </Select>
    );
  }
};
