/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DragOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useField, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import classNames from 'classnames';
import React, {
  createContext,
  FC,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponentContext } from '../';
import { SchemaInitializer, SchemaSettings, SchemaToolbarProvider, useSchemaInitializerRender } from '../application';
import { useSchemaSettingsRender } from '../application/schema-settings/hooks/useSchemaSettingsRender';
import { useDataSourceManager } from '../data-source/data-source/DataSourceManagerProvider';
import { useDataSource } from '../data-source/data-source/DataSourceProvider';
import { RefreshComponentProvider, useRefreshFieldSchema } from '../formily/NocoBaseRecursionField';
import { DragHandler, useCompile, useDesignable, useGridContext, useGridRowContext } from '../schema-component';
import { gridRowColWrap } from '../schema-initializer/utils';
import { SchemaSettingsDropdown } from './SchemaSettings';
import { useGetAriaLabelOfDesigner } from './hooks/useGetAriaLabelOfDesigner';
import { useStyles } from './styles';

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
  showDataSource?: boolean;
}

/**
 * @deprecated use `SchemaToolbar` instead
 */
export const GeneralSchemaDesigner: FC<GeneralSchemaDesignerProps> = (props: any) => {
  const fieldSchema = useFieldSchema();
  const {
    disableInitializer,
    title,
    template,
    schemaSettings,
    contextValue,
    draggable = true,
    showDataSource = true,
  } = { ...props, ...(fieldSchema['x-toolbar-props'] || {}) } as GeneralSchemaDesignerProps;
  const { dn, designable } = useDesignable();
  const field = useField();
  const { t } = useTranslation();
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
  const dm = useDataSourceManager();
  const dataSources = dm?.getDataSources();
  const dataSourceContext = useDataSource();
  const dataSource = dataSources?.length > 1 && dataSourceContext;
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
    <SchemaToolbarProvider {...contextValue}>
      <div
        className={classNames(
          'general-schema-designer',
          overrideAntdCSS,
          fieldSchema['x-template-uid'] ? 'nb-in-template' : '',
        )}
      >
        {title && (
          <div className={classNames('general-schema-designer-title', titleCss)}>
            <Space size={2}>
              <span className={'title-tag'}>
                {showDataSource && dataSource
                  ? `${compile(dataSource?.displayName)} > ${compile(title)}`
                  : compile(title)}
              </span>
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
              <SchemaSettingsDropdown
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
              </SchemaSettingsDropdown>
            )}
          </Space>
        </div>
      </div>
    </SchemaToolbarProvider>
  );
};

export interface SchemaToolbarProps {
  title?: string | string[];
  draggable?: boolean;
  initializer?: string | SchemaInitializer<any> | false;
  settings?: string | SchemaSettings<any> | false;
  /**
   * @default true
   */
  showBorder?: boolean;
  showBackground?: boolean;
  toolbarClassName?: string;
  toolbarStyle?: React.CSSProperties;
  spaceWrapperClassName?: string;
  spaceWrapperStyle?: React.CSSProperties;
  spaceClassName?: string;
  spaceStyle?: React.CSSProperties;
  /**
   * The HTML element that listens for mouse enter/leave events.
   * Parent element is used by default.
   */
  container?: HTMLElement;
  onVisibleChange?: (nextVisible: boolean) => void;
}

const InternalSchemaToolbar: FC<SchemaToolbarProps> = React.memo((props) => {
  const fieldSchema = useFieldSchema();
  const {
    title,
    initializer,
    settings,
    showBackground,
    spaceWrapperClassName,
    spaceWrapperStyle,
    showBorder = true,
    draggable = true,
    spaceClassName,
    spaceStyle,
    toolbarClassName,
    toolbarStyle = {},
    container,
  } = {
    ...props,
    ...(fieldSchema?.['x-toolbar-props'] || {}),
  } as SchemaToolbarProps;
  const compile = useCompile();
  const { draggable: draggableCtx } = useContext(SchemaComponentContext);
  const { componentCls, hashId } = useStyles();
  const { t } = useTranslation();
  const { getAriaLabel } = useGetAriaLabelOfDesigner();
  const dm = useDataSourceManager();
  const dataSources = dm?.getDataSources();
  const dataSourceContext = useDataSource();
  const dataSource = dataSources?.length > 1 && dataSourceContext;
  const refreshFieldSchema = useRefreshFieldSchema();
  const templateTitleLabel = useRef(t('Reference template'));

  const refresh = useCallback(() => {
    refreshFieldSchema({ refreshParentSchema: true });
  }, [refreshFieldSchema]);

  const titleArr = useMemo(() => {
    if (!title) return undefined;
    if (typeof title === 'string') return [compile(title)];
    if (Array.isArray(title)) {
      if (title.length === 1 && fieldSchema['x-template-title']) {
        templateTitleLabel.current = t('Inherited template');
        return compile([title[0], fieldSchema['x-template-title']]);
      }
      return compile(title);
    }
  }, [title, fieldSchema]);

  const { render: schemaSettingsRender, exists: schemaSettingsExists } = useSchemaSettingsRender(
    settings || fieldSchema?.['x-settings'],
    fieldSchema?.['x-settings-props'],
  );
  const { render: schemaInitializerRender, exists: schemaInitializerExists } = useSchemaInitializerRender(
    initializer || fieldSchema?.['x-initializer'],
    fieldSchema?.['x-initializer-props'],
  );
  const rowCtx = useGridRowContext();
  const gridContext = useGridContext();
  const initializerProps: any = useMemo(() => {
    return {
      insertPosition: 'afterEnd',
      wrap: rowCtx?.cols?.length === 1 ? gridRowColWrap : undefined,
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

  const dragElement = useMemo(() => {
    if (draggable === false || draggableCtx === false) return null;
    return (
      <DragHandler>
        <DragOutlined role="button" aria-label={getAriaLabel('drag-handler')} />
      </DragHandler>
    );
  }, [draggable, getAriaLabel, draggableCtx]);

  const initializerElement = useMemo(() => {
    if (initializer === false) return null;
    if (schemaInitializerExists) {
      return schemaInitializerRender(initializerProps);
    }
    if (gridContext?.InitializerComponent || gridContext?.renderSchemaInitializer) {
      return gridContext?.InitializerComponent ? (
        <gridContext.InitializerComponent {...initializerProps} />
      ) : (
        gridContext.renderSchemaInitializer?.(initializerProps)
      );
    }
  }, [gridContext, initializer, initializerProps, schemaInitializerExists, schemaInitializerRender]);

  const settingsElement = useMemo(() => {
    return settings !== false && schemaSettingsExists ? schemaSettingsRender() : null;
  }, [schemaSettingsExists, schemaSettingsRender, settings]);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const hiddenClassName = process.env.__E2E__ ? 'hidden-e2e' : 'hidden';

  useEffect(() => {
    const toolbarElement = toolbarRef.current;
    let parentElement = toolbarElement?.parentElement;
    while (parentElement && parentElement.clientHeight === 0) {
      parentElement = parentElement.parentElement;
    }

    const el = container || parentElement;

    if (!el) {
      return;
    }

    function show() {
      if (toolbarElement) {
        if (process.env.__E2E__) {
          toolbarElement.style.display = 'block';
        } else {
          toolbarElement.classList.remove(hiddenClassName);
        }
        props.onVisibleChange?.(true);
      }
    }

    function hide() {
      if (toolbarElement) {
        if (process.env.__E2E__) {
          toolbarElement.style.display = 'none';
        } else {
          toolbarElement.classList.add(hiddenClassName);
        }
        props.onVisibleChange?.(false);
      }
    }

    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', hide);
    return () => {
      el.removeEventListener('mouseenter', show);
      el.removeEventListener('mouseleave', hide);
    };
  }, [props.onVisibleChange, container]);

  const containerStyle = useMemo(
    () => ({
      border: showBorder ? 'auto' : 0,
      background: showBackground ? 'auto' : 0,
      ...toolbarStyle,
    }),
    [showBackground, showBorder, toolbarStyle],
  );

  return (
    <div
      ref={toolbarRef}
      className={classNames(componentCls, hashId, toolbarClassName, 'schema-toolbar', hiddenClassName)}
      style={containerStyle}
    >
      {titleArr && (
        <div className={'toolbar-title'}>
          <Space size={2}>
            <span key={titleArr[0]} className={'toolbar-title-tag'}>
              {dataSource ? `${compile(dataSource?.displayName)} > ${titleArr[0]}` : titleArr[0]}
            </span>
            {titleArr[1] && (
              <span className={'toolbar-title-tag'}>
                {`${templateTitleLabel.current}: ${`${titleArr[1]}` || t('Untitled')}`}
              </span>
            )}
          </Space>
        </div>
      )}
      <div className={classNames('toolbar-icons', spaceWrapperClassName)} style={spaceWrapperStyle}>
        <Space size={3} align={'center'} className={spaceClassName} style={spaceStyle}>
          {dragElement}
          <RefreshComponentProvider refresh={refresh}>{initializerElement}</RefreshComponentProvider>
          {settingsElement}
        </Space>
      </div>
    </div>
  );
});

InternalSchemaToolbar.displayName = 'InternalSchemaToolbar';

/**
 * @internal
 */
export const SchemaToolbarVisibleContext = createContext(false);

export const SchemaToolbar: FC<SchemaToolbarProps> = React.memo((props) => {
  const { designable } = useDesignable();
  const [visible, setVisible] = useState(false);

  const onVisibleChange = useCallback((nextVisible: boolean) => {
    startTransition(() => {
      setVisible(nextVisible);
    });
  }, []);

  if (!designable) {
    return null;
  }

  return (
    <SchemaToolbarVisibleContext.Provider value={visible}>
      <InternalSchemaToolbar {...props} onVisibleChange={onVisibleChange} />
    </SchemaToolbarVisibleContext.Provider>
  );
});

SchemaToolbar.displayName = 'SchemaToolbar';
