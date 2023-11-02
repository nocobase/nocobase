import { DragOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useField, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DragHandler, useCompile, useDesignable, useGridContext, useGridRowContext } from '../schema-component';
import { gridRowColWrap } from '../schema-initializer/utils';
import { SchemaSettings } from './SchemaSettings';
import { useGetAriaLabelOfDesigner } from './hooks/useGetAriaLabelOfDesigner';

const titleCss = css`
  pointer-events: none;
  position: absolute;
  font-size: 12px;
  /* background: var(--colorSettings);
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
    background: var(--colorSettings);
    color: #fff;
    display: block;
  }
`;

const overrideAntdCSS = css`
  & .ant-space-item .anticon {
    margin: 0;
  }

  &:hover {
    display: block !important;
  }
`;

export const GeneralSchemaDesigner = (props: any) => {
  const { disableInitializer, title, template, draggable = true } = props;
  const { dn, designable } = useDesignable();
  const field = useField();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const compile = useCompile();
  const { getAriaLabel } = useGetAriaLabelOfDesigner();

  const schemaSettingsProps = {
    dn,
    field,
    fieldSchema,
  };

  const rowCtx = useGridRowContext();
  const ctx = useGridContext();
  const templateName = ['FormItem', 'ReadPrettyFormItem'].includes(template?.componentName)
    ? `${template?.name} ${t('(Fields only)')}`
    : template?.name;
  const initializerProps = useMemo(() => {
    return {
      insertPosition: 'afterEnd',
      wrap: rowCtx?.cols?.length > 1 ? undefined : gridRowColWrap,
      component: (
        <PlusOutlined
          role="button"
          aria-label={getAriaLabel('schema-initializer')}
          style={{ cursor: 'pointer', fontSize: 14 }}
        />
      ),
    };
  }, [rowCtx?.cols?.length]);

  if (!designable) {
    return null;
  }

  return (
    <div className={classNames('general-schema-designer', overrideAntdCSS)}>
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
              <DragOutlined role="button" aria-label={getAriaLabel('drag-handler')} />
            </DragHandler>
          )}
          {!disableInitializer &&
            (ctx?.InitializerComponent ? (
              <ctx.InitializerComponent {...initializerProps} />
            ) : (
              ctx?.renderSchemaInitializer?.(initializerProps)
            ))}
          <SchemaSettings
            title={
              <MenuOutlined
                role="button"
                aria-label={getAriaLabel('schema-settings')}
                style={{ cursor: 'pointer', fontSize: 12 }}
              />
            }
            {...schemaSettingsProps}
          >
            {props.children}
          </SchemaSettings>
        </Space>
      </div>
    </div>
  );
};
