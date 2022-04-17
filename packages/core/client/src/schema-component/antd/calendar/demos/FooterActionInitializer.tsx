import { observer, useFieldSchema } from '@formily/react';
import { Switch } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection } from '../../../../collection-manager';
import { SchemaInitializer } from '../../../../schema-initializer';
import { useDesignable } from '../../../hooks';

export const FooterActionInitializer = observer((props: any) => {
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
              title: t('Edit'),
              component: InitializeAction,
              schema: {
                title: t('Edit'),
                'x-component': 'Action',
                'x-component-props': {
                  useAction: '{{ useEditAction }}',
                  type: 'primary',
                },
                'x-action': `calendar:edit`,
                'x-align': 'right',
                properties: {
                  modal: {
                    'x-component': 'Action.Drawer',
                    'x-decorator': 'Form',
                    'x-decorator-props': {
                      useValues: '{{ useValues }}',
                    },
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
                          update: {
                            title: 'update',
                            'x-component': 'Action',
                            'x-component-props': {
                              useAction: '{{ useUpdateAction }}',
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
            {
              type: 'item',
              title: t('Delete'),
              component: InitializeAction,
              schema: {
                title: t('Delete'),
                'x-component': 'Action',
                'x-component-props': {
                  useAction: '{{ useRemoveAction }}',
                  type: 'danger',
                },
                'x-action': `calendar:delete`,
                'x-align': 'right',
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
