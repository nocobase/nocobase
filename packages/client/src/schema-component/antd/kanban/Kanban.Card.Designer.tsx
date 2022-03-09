import { MenuOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useField, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile, useDesignable } from '../../../schema-component';
import { SchemaInitializer } from '../../../schema-initializer';
import { useFormItemInitializerFields } from '../../../schema-initializer/Initializers/utils';

const titleCss = css`
  pointer-events: none;
  position: absolute;
  font-size: 12px;
  background: #f18b62;
  color: #fff;
  padding: 0 5px;
  line-height: 16px;
  height: 16px;
  border-bottom-right-radius: 2px;
  border-radius: 2px;
  top: 2px;
  left: 2px;
`;

export const removeGridFormItem = (schema, cb) => {
  cb(schema, {
    removeParentsIfNoChildren: true,
    breakRemoveOn: {
      'x-component': 'Kanban.Card',
    },
  });
};

export const KanbanCardDesigner = (props: any) => {
  const { dn, designable } = useDesignable();
  const { t } = useTranslation();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const compile = useCompile();
  const schemaSettingsProps = {
    dn,
    field,
    fieldSchema,
  };
  const fields = useFormItemInitializerFields();
  if (!designable) {
    return null;
  }
  return (
    <div className={'general-schema-designer'}>
      <div className={'general-schema-designer-icons'}>
        <Space size={2} align={'center'}>
          <SchemaInitializer.Button
            wrap={(s) => {
              s['type'] = 'string';
              s['x-read-pretty'] = true;
              return s;
            }}
            items={[
              {
                type: 'itemGroup',
                title: t('Display fields'),
                children: fields.map((field) => {
                  return {
                    ...field,
                    remove: removeGridFormItem,
                  };
                }),
              },
            ]}
            component={<MenuOutlined style={{ cursor: 'pointer', fontSize: 12 }} />}
          />
        </Space>
      </div>
    </div>
  );
};
