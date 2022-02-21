import { observer, useFieldSchema } from '@formily/react';
import { Switch } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { useDesignable } from '../../../schema-component';

const useCurrentActionSchema = (action: string) => {
  const fieldSchema = useFieldSchema();
  const { remove } = useDesignable();
  const schema = fieldSchema.reduceProperties((buf, s) => {
    if (s['x-action'] === action) {
      return s;
    }
    return buf;
  });
  return {
    schema,
    exists: !!schema,
    remove() {
      schema && remove(schema);
    },
  };
};

const InitializeAction = SchemaInitializer.itemWrap((props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentActionSchema(item.schema['x-action']);
  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          type: 'void',
          'x-designer': 'Action.Designer',
          'x-component': 'Action',
          ...item.schema,
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {item.title}
        <Switch style={{ marginLeft: 20 }} size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
});

export const CalendarActionInitializer = observer((props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
      style={{ marginLeft: 8 }}
      items={[
        {
          type: 'itemGroup',
          title: t('Enable actions'),
          children: [
            {
              type: 'item',
              title: t('Today'),
              component: InitializeAction,
              schema: {
                title: t('Today'),
                'x-component': 'Calendar.Today',
                'x-action': `calendar:today`,
                'x-align': 'left',
              },
            },
            {
              type: 'item',
              title: t('Turn page'),
              component: InitializeAction,
              schema: {
                title: t('Turn page'),
                'x-component': 'Calendar.Nav',
                'x-action': `calendar:nav`,
                'x-align': 'left',
              },
            },
            {
              type: 'item',
              title: t('Title'),
              component: InitializeAction,
              schema: {
                title: t('Title'),
                'x-component': 'Calendar.Title',
                'x-action': `calendar:title`,
                'x-align': 'left',
              },
            },
            {
              type: 'item',
              title: t('Select view'),
              component: InitializeAction,
              schema: {
                title: t('Select view'),
                'x-component': 'Calendar.ViewSelect',
                'x-action': `calendar:viewSelect`,
                'x-align': 'left',
              },
            },
            {
              type: 'item',
              title: t('Filter'),
              component: InitializeAction,
              schema: {
                title: '{{ t("Filter") }}',
                'x-action': 'filter',
                'x-align': 'left',
              },
            },
            {
              type: 'item',
              title: t('Add new'),
              component: InitializeAction,
              schema: {
                type: 'void',
                title: '{{ t("Add new") }}',
                'x-action': 'create',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  openMode: 'drawer',
                },
                properties: {
                  drawer: {
                    type: 'void',
                    title: '{{ t("Add new record") }}',
                    'x-component': 'Action.Container',
                    'x-component-props': {},
                    'x-decorator': 'Form',
                    properties: {
                      grid: {
                        type: 'void',
                        'x-component': 'Grid',
                        'x-item-initializer': 'FormItemInitializer',
                        properties: {},
                      },
                      footer: {
                        type: 'void',
                        'x-component': 'Action.Container.Footer',
                        properties: {
                          actions: {
                            type: 'void',
                            'x-action-initializer': 'PopupFormActionInitializer',
                            'x-decorator': 'DndContext',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                            },
                            properties: {},
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: 'item',
              title: t('Delete'),
              component: InitializeAction,
              schema: {
                title: '{{ t("Delete") }}',
                'x-action': 'destroy',
                'x-component-props': {
                  confirm: {
                    title: "{{t('Delete record')}}",
                    content: "{{t('Are you sure you want to delete it?')}}",
                  },
                  useAction: '{{ cm.useBulkDestroyAction }}',
                },
              },
            },
          ],
        },
      ]}
    >
      {t('Configure actions')}
    </SchemaInitializer.Button>
  );
});
