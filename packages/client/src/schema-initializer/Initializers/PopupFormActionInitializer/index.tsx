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

export const PopupFormActionInitializer = observer((props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
      items={[
        {
          type: 'itemGroup',
          title: t('Enable actions'),
          children: [
            {
              type: 'item',
              title: t('Submit'),
              component: InitializeAction,
              schema: {
                title: '{{ t("Submit") }}',
                'x-action': 'submit',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction: '{{ cm.useCreateAction }}',
                },
              },
            },
            {
              type: 'item',
              title: t('Cancel'),
              component: InitializeAction,
              schema: {
                title: '{{ t("Cancel") }}',
                'x-action': 'cancel',
                'x-component': 'Action',
                'x-component-props': {
                  useAction: '{{ cm.useCancelAction }}',
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
