import React, { useState } from 'react';
import { ISchema } from '@formily/react';

export const recordPickerSelector: ISchema = {
  type: 'void',
  title: '{{ t("Select record") }}',
  'x-component': 'RecordPicker.Selector',
  'x-component-props': {
    className: 'nb-record-picker-selector',
  },
  properties: {
    grid: {
      type: 'void',
      'x-component': 'Grid',
      'x-initializer': 'TableSelectorInitializers',
      properties: {},
    },
    footer: {
      'x-component': 'Action.Container.Footer',
      'x-component-props': {},
      properties: {
        actions: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-component-props': {},
          properties: {
            submit: {
              title: '{{ t("Submit") }}',
              'x-action': 'submit',
              'x-component': 'Action',
              'x-designer': 'Action.Designer',
              'x-component-props': {
                type: 'primary',
                htmlType: 'submit',
                useProps: '{{ usePickActionProps }}',
              },
            },
          },
        },
      },
    },
  },
};

export const recordPickerViewer = {
  type: 'void',
  title: '{{ t("View record") }}',
  'x-component': 'RecordPicker.Viewer',
  'x-component-props': {
    className: 'nb-action-popup',
  },
  properties: {
    tabs: {
      type: 'void',
      'x-component': 'Tabs',
      'x-component-props': {},
      'x-initializer': 'TabPaneInitializers',
      properties: {
        tab1: {
          type: 'void',
          title: '{{t("Details")}}',
          'x-component': 'Tabs.TabPane',
          'x-designer': 'Tabs.Designer',
          'x-component-props': {},
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'RecordBlockInitializers',
              properties: {},
            },
          },
        },
      },
    },
  },
};
import { useFieldSchema, useField, useForm, RecursionField } from '@formily/react';
import { ActionContext } from '../';
import { CollectionProvider, SchemaComponentOptions, RecordProvider } from '../../../';
import { useCreateActionProps as useCAP } from '../../../block-provider/hooks';

export const AssociationFieldSelector = (props) => {
  const { fieldNames, item } = props;
  const schema = useFieldSchema();
  const field = useField();
  const [visible, setVisible] = useState(false);
  const form = useForm();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <RecordProvider record={item}>
        <CollectionProvider name={props.service.resource}>
          <SchemaComponentOptions>
            <RecursionField schema={schema || ({} as any)} name={'selector'} />
          </SchemaComponentOptions>
        </CollectionProvider>
      </RecordProvider>
    </ActionContext.Provider>
  );
};
