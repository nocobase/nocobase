import { DragOutlined, MenuOutlined } from '@ant-design/icons';
import { useField, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { DragHandler, useDesignable } from '../schema-component';
import { SchemaSettings } from './SchemaSettings';

export const GeneralSchemaDesigner = (props: any) => {
  const { dn, designable } = useDesignable();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const schemaSettingsProps = {
    dn,
    field,
    fieldSchema,
  };
  if (!designable) {
    return null;
  }
  return (
    <div className={'general-schema-designer'}>
      <div className={'general-schema-designer-icons'}>
        <Space size={2} align={'center'}>
          <DragHandler>
            <DragOutlined />
          </DragHandler>
          <SchemaSettings title={<MenuOutlined style={{ cursor: 'pointer', fontSize: 12 }} />} {...schemaSettingsProps}>
            {props.children}
          </SchemaSettings>
        </Space>
      </div>
    </div>
  );
};
