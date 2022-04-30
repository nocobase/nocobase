import React from 'react';
import { Select } from 'antd';
import { action } from '@formily/reactive';
import { useForm } from '@formily/react';

import { useCollectionDataSource, useCollectionManager } from '../../collection-manager';
import { useCompile } from '../../schema-component';

import { useFlowContext } from '../WorkflowCanvas';
import { BaseTypeSet } from '../calculators';
import { collection, filter } from '../schemas/collection';
import { useTranslation } from 'react-i18next';

function useCollectionFieldsDataSource() {
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const { values } = useForm();
  const fields = getCollectionFields(values?.config?.collection);

  return (field: any) => {
    action.bound((data: any) => {
      field.dataSource = data
        .filter(field => (
          !field.hidden
          && (field.uiSchema ? !field.uiSchema['x-read-pretty'] : true)
        ))
        .map(field => ({
          label: compile(field.uiSchema?.title),
          value: field.name
        }));
    })(fields);
  };
}

export default {
  title: '{{t("Model event")}}',
  type: 'model',
  fieldset: {
    'config.collection': collection,
    'config.mode': {
      type: 'number',
      title: '{{t("Trigger on")}}',
      name: 'config.mode',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: [
          { value: 1, label: '{{t("After record added")}}' },
          { value: 2, label: '{{t("After record updated")}}' },
          { value: 3, label: '{{t("After record added or updated")}}' },
          { value: 4, label: '{{t("After record deleted")}}' }
        ]
      }
    },
    'config.changed': {
      type: 'array',
      name: 'changed',
      title: '{{t("Changed fields")}}',
      description: '{{t("Select the fields which changed will trigger the event only")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        mode: 'multiple',
      },
      'x-reactions': [
        '{{useCollectionFieldsDataSource()}}'
      ]
    },
    'config.condition': {
      ...filter,
      name: 'config.condition',
      title: '{{t("Match condition")}}',
    }
  },
  scope: {
    useCollectionDataSource,
    useCollectionFieldsDataSource
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
