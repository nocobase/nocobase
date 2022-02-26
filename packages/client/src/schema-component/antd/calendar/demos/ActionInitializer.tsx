import { observer, useFieldSchema } from '@formily/react';
import { Switch } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection } from '../../../../collection-manager';
import { SchemaInitializer } from '../../../../schema-initializer';
import { useDesignable } from '../../../hooks';

export const ActionInitializer = observer((props: any) => {
  const { name: collectName } = useCollection();
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
              title: t('Add new'),
              component: InitializeAction,
              schema: {
                title: t('Add new'),
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                },
                'x-action': `action`,
                'x-align': 'right',
                properties: {
                  modal: {
                    'x-component': 'Action.Drawer',
                    'x-decorator': 'Form',
                    type: 'void',
                    title: 'Drawer Title',
                    properties: {
                      grid: {
                        type: 'void',
                        'x-component': 'Grid',
                        'x-item-initializer': 'FormItemInitializer',
                      },
                      footer: {
                        'x-component': 'Action.Drawer.Footer',
                        type: 'void',
                        properties: {
                          ok: {
                            title: 'submit',
                            'x-component': 'Action',
                            'x-component-props': {
                              useAction: '{{ useSaveAction }}',
                              type: 'primary',
                            },
                          },
                          close: {
                            title: 'Close',
                            'x-component': 'Action',
                            'x-component-props': {
                              useAction: '{{ useCloseAction }}',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      ]}
    >
      Configure actions
    </SchemaInitializer.Button>
  );
});

const useCurrentActionSchema = (action: string) => {
  const fieldSchema = useFieldSchema();
  const { remove } = useDesignable();
  const schema: any = fieldSchema.reduceProperties((buf, s) => {
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
          'x-component': 'Action',
          ...item.schema,
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {item.title} <Switch size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
});
