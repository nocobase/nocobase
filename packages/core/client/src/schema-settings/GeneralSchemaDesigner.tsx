import { DragOutlined, MenuOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useField, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGeneralDesignerContext } from '..';
import { DragHandler, useCompile, useDesignable } from '../schema-component';
import { SchemaSettings } from './SchemaSettings';

const titleCss = css`
  pointer-events: none;
  position: absolute;
  font-size: 12px;
  /* background: #f18b62;
  color: #fff; */
  padding: 0;
  line-height: 16px;
  height: 16px;
  border-bottom-right-radius: 2px;
  border-radius: 2px;
  top: 2px;
  left: 2px;
  .title-tag {
    padding: 0 3px;
    border-radius: 2px;
    background: #f18b62;
    color: #fff;
    display: block;
  }
`;

export const GeneralSchemaDesigner = (props: any) => {
  const { title, template, draggable = true } = props;
  const { dn, designable } = useDesignable();
  const field = useField();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const compile = useCompile();
  const { designerActions = [] } = useGeneralDesignerContext() ?? {};
  const schemaSettingsProps = {
    dn,
    field,
    fieldSchema,
  };
  if (!designable) {
    return null;
  }
  const templateName = ['FormItem', 'ReadPrettyFormItem'].includes(template?.componentName)
    ? `${template?.name} ${t('(Fields only)')}`
    : template?.name;
  return (
    <div className={'general-schema-designer'}>
      {title && (
        <div className={classNames('general-schema-designer-title', titleCss)}>
          <Space size={2}>
            <span className={'title-tag'}>{compile(title)}</span>
            {template && (
              <span className={'title-tag'}>
                {t('Reference template')}: {templateName || t('Untitled')}
              </span>
            )}
          </Space>
        </div>
      )}
      <div className={'general-schema-designer-icons'}>
        <Space size={2} align={'center'}>
          {draggable && (
            <DragHandler>
              <DragOutlined />
            </DragHandler>
          )}
          {designerActions}
          <SchemaSettings title={<MenuOutlined style={{ cursor: 'pointer', fontSize: 12 }} />} {...schemaSettingsProps}>
            {props.children}
          </SchemaSettings>
        </Space>
      </div>
    </div>
  );
};
