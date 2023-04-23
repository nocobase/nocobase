import { MenuOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { ISchema, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Space } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { createDesignable, useDesignable } from '../../../schema-component';
import { SchemaInitializer, SchemaInitializerItemOptions } from '../../../schema-initializer';
import { OpenModeSchemaItems } from '../../../schema-items';

const gridRowColWrap = (schema: ISchema) => {
  schema['x-read-pretty'] = true;
  return {
    type: 'void',
    'x-component': 'Grid.Row',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Grid.Col',
        properties: {
          [schema.name || uid()]: schema,
        },
      },
    },
  };
};

export const KanbanCardDesigner = (props: any) => {
  const { designable } = useDesignable();
  const { t } = useTranslation();
  const api = useAPIClient();
  const { refresh } = useDesignable();
  const fieldSchema = useFieldSchema();
  const items: any = [
    {
      type: 'item',
      title: t('Display field title'),
      component: 'Kanban.Card.Designer.TitleSwitch',
      enable: true,
    } as SchemaInitializerItemOptions,
  ];

  items.push({
    type: 'item',
    component: OpenModeSchemaItems,
  } as SchemaInitializerItemOptions);

  if (!designable) {
    return null;
  }
  return (
    <div className={'general-schema-designer'}>
      <div className={'general-schema-designer-icons'}>
        <Space size={2} align={'center'}>
          <SchemaInitializer.Button
            wrap={gridRowColWrap}
            insert={(schema) => {
              const gridSchema = fieldSchema.reduceProperties((buf, schema) => {
                if (schema['x-component'] === 'Grid') {
                  return schema;
                }
                return buf;
              }, null);
              if (!gridSchema) {
                return;
              }
              const dn = createDesignable({
                t,
                api,
                refresh,
                current: gridSchema,
              });
              dn.loadAPIClientEvents();
              dn.insertBeforeEnd(schema);
            }}
            items={items}
            component={<MenuOutlined style={{ cursor: 'pointer', fontSize: 12 }} />}
          />
        </Space>
      </div>
    </div>
  );
};
