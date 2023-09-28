import { DragOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useField, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DragHandler, useCompile, useDesignable, useGridContext, useGridRowContext } from '../schema-component';
import { gridRowColWrap } from '../schema-initializer/utils';
import { SchemaSettings } from './SchemaSettings';

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

const DesignerControl = ({ onShow, children }) => {
  const divRef = React.useRef(null);
  const shouldUnmount = React.useRef(true);
  const isVisible = React.useRef(false);
  const unmount = useCallback(
    _.debounce(() => {
      if (shouldUnmount.current && !isVisible.current) {
        onShow(false);
      }
    }, 300) as () => void,
    [onShow],
  );

  useEffect(() => {
    // 兼容旧浏览器
    if (!IntersectionObserver) {
      return onShow(true);
    }

    const observer = new IntersectionObserver((entries) => {
      // 兼容旧浏览器
      if (entries[0].isIntersecting === undefined) {
        return onShow(true);
      }

      if (entries[0].isIntersecting) {
        isVisible.current = true;
        onShow(true);
      } else {
        isVisible.current = false;
        unmount();
      }
    });

    observer.observe(divRef.current);
    return () => {
      observer.disconnect();
    };
  }, [unmount, onShow]);

  const onMouseEnter = useCallback(() => {
    shouldUnmount.current = false;
  }, []);
  const onMouseLeave = useCallback(() => {
    shouldUnmount.current = true;
    unmount();
  }, [unmount]);

  return (
    <div
      ref={divRef}
      className={classNames('general-schema-designer', overrideAntdCSS)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
};

export const GeneralSchemaDesigner = (props: any) => {
  const { disableInitializer, title, template, draggable = true } = props;
  const { dn, designable } = useDesignable();
  const field = useField();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const compile = useCompile();
  const [visible, setVisible] = useState(false);
  const schemaSettingsProps = {
    dn,
    field,
    fieldSchema,
  };

  const onShow = useCallback((value) => setVisible(value), []);

  const rowCtx = useGridRowContext();
  const ctx = useGridContext();
  const templateName = ['FormItem', 'ReadPrettyFormItem'].includes(template?.componentName)
    ? `${template?.name} ${t('(Fields only)')}`
    : template?.name;
  const initializerProps = useMemo(() => {
    return {
      insertPosition: 'afterEnd',
      wrap: rowCtx?.cols?.length > 1 ? undefined : gridRowColWrap,
      component: <PlusOutlined data-testid="designer-add-block" style={{ cursor: 'pointer', fontSize: 14 }} />,
    };
  }, [rowCtx?.cols?.length]);

  if (!designable) {
    return null;
  }

  return (
    <DesignerControl onShow={onShow}>
      {visible ? (
        <>
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
                  <DragOutlined data-testid="designer-drag" />
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
                  <MenuOutlined data-testid="designer-schema-settings" style={{ cursor: 'pointer', fontSize: 12 }} />
                }
                {...schemaSettingsProps}
              >
                {props.children}
              </SchemaSettings>
            </Space>
          </div>
        </>
      ) : null}
    </DesignerControl>
  );
};
