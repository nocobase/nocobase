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
import {
  useAssociatedFormItemInitializerFields,
  useFormItemInitializerFields,
} from '../../../schema-initializer/utils';
import { OpenModeSchemaItems } from '../../../schema-items';
import { useGetAriaLabelOfDesigner } from '../../../schema-settings/hooks/useGetAriaLabelOfDesigner';

const titleCss = css`
  pointer-events: none;
  position: absolute;
  font-size: 12px;
  background: var(--colorSettings);
  color: #fff;
  padding: 0 5px;
  line-height: 16px;
  height: 16px;
  border-bottom-right-radius: 2px;
  border-radius: 2px;
  top: 2px;
  left: 2px;
`;

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

// export const removeGridFormItem = (schema, cb) => {
//   cb(schema, {
//     removeParentsIfNoChildren: true,
//     breakRemoveOn: {
//       'x-component': 'Kanban.Card',
//     },
//   });
// };

export const KanbanCardDesigner = (props: any) => {
  const { designable } = useDesignable();
  const { t } = useTranslation();
  const api = useAPIClient();
  const { refresh } = useDesignable();
  const fieldSchema = useFieldSchema();
  const fields = useFormItemInitializerFields({
    readPretty: true,
    block: 'Kanban',
  });
  const associationFields = useAssociatedFormItemInitializerFields({ readPretty: true, block: 'Kanban' });
  const { getAriaLabel } = useGetAriaLabelOfDesigner();

  const items: any = [
    {
      type: 'itemGroup',
      title: t('Display fields'),
      children: fields,
    },
  ];
  if (associationFields.length > 0) {
    items.push(
      {
        type: 'divider',
      },
      {
        type: 'itemGroup',
        title: t('Display association fields'),
        children: associationFields,
      },
    );
  }

  items.push(
    {
      type: 'divider',
    },
    {
      type: 'item',
      title: t('Display field title'),
      component: 'Kanban.Card.Designer.TitleSwitch',
      enable: true,
    } as SchemaInitializerItemOptions,
    {
      type: 'item',
      component: OpenModeSchemaItems,
    } as SchemaInitializerItemOptions,
  );

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
            component={
              <MenuOutlined
                role="button"
                aria-label={getAriaLabel('schema-initializer')}
                style={{ cursor: 'pointer', fontSize: 12 }}
              />
            }
          />
        </Space>
      </div>
    </div>
  );
};
