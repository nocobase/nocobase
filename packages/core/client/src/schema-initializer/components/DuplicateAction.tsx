import React from 'react';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { SchemaComponent } from '../../schema-component';

export const DuplicateAction = observer((props) => {
    console.log(props)
  const field = useField();
  const fieldSchema=useFieldSchema()
  const schema: Schema = {
    type: 'void',
    title: '{{ t("Duplicate") }}',
    'x-action': 'duplicate',
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
    'x-component-props': {
      openMode: 'drawer',
      icon: 'EditOutlined',
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("Duplicate") }}',
        'x-component': 'Action.Container',
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
                title: '{{t("Duplicate")}}',
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
      },
    },
  };

  return <RecursionField schema={schema} name={fieldSchema.name} />;
});
