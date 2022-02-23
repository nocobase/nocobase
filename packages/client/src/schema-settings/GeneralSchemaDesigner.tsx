import { DragOutlined, MenuOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useField, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { DragHandler, useDesignable } from '../schema-component';
import { SchemaSettings } from './SchemaSettings';

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

export const GeneralSchemaDesigner = (props: any) => {
  const { title } = props;
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
      {title && <div className={classNames('general-schema-designer-title', titleCss)}>{title}</div>}
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
