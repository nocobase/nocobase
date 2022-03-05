import { MenuOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useField, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { useCompile, useDesignable } from '../../../schema-component';
import { SchemaSettings } from '../../../schema-settings';

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

export const KanbanCardDesigner = (props: any) => {
  const { dn, designable } = useDesignable();
  const field = useField();
  const fieldSchema = useFieldSchema();
  debugger;
  const compile = useCompile();
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
          <SchemaSettings title={<MenuOutlined style={{ cursor: 'pointer', fontSize: 12 }} />} {...schemaSettingsProps}>
            {props.children}
          </SchemaSettings>
        </Space>
      </div>
    </div>
  );
};
