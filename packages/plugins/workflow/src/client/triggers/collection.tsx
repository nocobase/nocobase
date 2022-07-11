import React from 'react';
import { Select } from 'antd';
import { observer, useForm, useFormEffects } from '@formily/react';

import { useCollectionDataSource, useCollectionManager, useCompile } from '@nocobase/client';

import { useFlowContext } from '../WorkflowCanvas';
import { collection, filter } from '../schemas/collection';
import { css } from '@emotion/css';
import { onFieldValueChange } from '@formily/core';
import CollectionFieldSelect from '../components/CollectionFieldSelect';

const FieldsSelect = observer((props) => {
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const { values, clearFormGraph, setValuesIn } = useForm();
  const fields = getCollectionFields(values?.config?.collection);
  useFormEffects(() => {
    onFieldValueChange('config.collection', (field) => {
      clearFormGraph('config.changed');
      setValuesIn('config.condition', null);
    });
  });

  return (
    <Select
      {...props}
      className={css`
        min-width: 6em;
      `}
    >
      {fields
        .filter(field => (
          !field.hidden
          && (field.uiSchema ? !field.uiSchema['x-read-pretty'] : true)
        ))
        .map(field => (
          <Select.Option key={field.name} value={field.name}>{compile(field.uiSchema?.title)}</Select.Option>
        ))}
    </Select>
  );
});



export default {
  title: '{{t("Collection event")}}',
  type: 'collection',
  fieldset: {
    'config.collection': {
      ...collection,
      ['x-reactions']: [
        ...collection['x-reactions'],
        {
          target: 'config.mode',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          }
        },
        {
          target: 'config.changed',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          }
        },
        {
          target: 'config.condition',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          }
        }
      ]
    },
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
        ],
        placeholder: '{{t("Trigger on")}}'
      },
      required: true,
      'x-reactions': [
        {
          target: 'config.changed',
          fulfill: {
            state: {
              disabled: '{{!($self.value & 0b010)}}',
            },
          }
        },
      ]
    },
    'config.changed': {
      type: 'array',
      name: 'changed',
      title: '{{t("Changed fields")}}',
      description: '{{t("Triggered only if one of the selected fields changes. If unselected, it means that it will be triggered when any field changes. When record is added or deleted, any field is considered to have been changed.")}}',
      'x-decorator': 'FormItem',
      'x-component': 'FieldsSelect',
      'x-component-props': {
        mode: 'multiple',
        placeholder: '{{t("Select Field")}}'
      }
    },
    'config.condition': {
      ...filter,
      name: 'config.condition',
      title: '{{t("Only triggers when match conditions")}}'
    }
  },
  scope: {
    useCollectionDataSource
  },
  components: {
    FieldsSelect
  },
  getter(props) {
    const { type, options, onChange } = props;
    const { workflow } = useFlowContext();
    const value = options?.path?.replace(/^data\./, '');

    return (
      <CollectionFieldSelect
        collection={workflow.config.collection}
        value={value}
        onChange={(value) => {
          onChange({ type, options: { ...options, path: `data.${value}` } });
        }}
      />
    );
  }
};
