import { DragOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useField, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import classNames from 'classnames';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DragHandler, useCompile, useDesignable, useGridContext, useGridRowContext } from '../schema-component';
import { gridRowColWrap } from '../schema-initializer/utils';
import { SchemaSettings } from './SchemaSettings';
import { useGetAriaLabelOfDesigner } from './hooks/useGetAriaLabelOfDesigner';
import { SchemaDesignerProvider, useSchemaSettingsRender } from '../application';

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

export interface GeneralSchemaDesignerProps {
  disableInitializer?: boolean;
  title?: string;
  template?: any;
  schemaSettings?: string;
  contextValue?: any;
  /**
   * @default true
   */
  draggable?: boolean;
}

export const GeneralSchemaDesigner: FC<GeneralSchemaDesignerProps> = (props: any) => {
  const { disableInitializer, title, template, schemaSettings, contextValue, draggable = true } = props;
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
  const { render: schemaSettingsRender, exists: schemaSettingsExists } = useSchemaSettingsRender(
    fieldSchema['x-settings'] || schemaSettings,
    fieldSchema['x-settings-props'],
  );
  const rowCtx = useGridRowContext();
  const ctx = useGridContext();
  const templateName = ['FormItem', 'ReadPrettyFormItem'].includes(template?.componentName)
    ? `${template?.name} ${t('(Fields only)')}`
    : template?.name;
  const initializerProps = useMemo(() => {
    return {
      insertPosition: 'afterEnd',
      wrap: rowCtx?.cols?.length > 1 ? undefined : gridRowColWrap,
      Component: (props: any) => (
        <PlusOutlined
          {...props}
          role="button"
          aria-label={getAriaLabel('schema-initializer')}
          style={{ cursor: 'pointer', fontSize: 14 }}
        />
      ),
    };
  }, [getAriaLabel, rowCtx?.cols?.length]);

  if (!designable) {
    return null;
  }

  return (
    <SchemaDesignerProvider {...contextValue}>
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
          <Space size={3} align={'center'}>
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
            {schemaSettingsExists ? (
              schemaSettingsRender(contextValue)
            ) : (
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
            )}
          </Space>
        </div>
      </div>
    </SchemaDesignerProvider>
  );
};
