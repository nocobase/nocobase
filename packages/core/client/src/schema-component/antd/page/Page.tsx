/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { PageHeader as AntdPageHeader } from '@ant-design/pro-layout';
import { css } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { Schema, SchemaOptionsContext, useFieldSchema } from '@formily/react';
import { Button, Tabs } from 'antd';
import classNames from 'classnames';
import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { NavigateFunction, Outlet, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { FormDialog } from '..';
import { useStyles as useAClStyles } from '../../../acl/style';
import { useRequest } from '../../../api-client';
import { useNavigateNoUpdate } from '../../../application/CustomRouterContextProvider';
import { useAppSpin } from '../../../application/hooks/useAppSpin';
import { useRouterBasename } from '../../../application/hooks/useRouterBasename';
import { useDocumentTitle } from '../../../document-title';
import { useGlobalTheme } from '../../../global-theme';
import { Icon } from '../../../icon';
import { useGetAriaLabelOfSchemaInitializer } from '../../../schema-initializer/hooks/useGetAriaLabelOfSchemaInitializer';
import { DndContext } from '../../common';
import { SortableItem } from '../../common/sortable-item';
import { SchemaComponent, SchemaComponentOptions } from '../../core';
import { useDesignable } from '../../hooks';
import { useToken } from '../__builtins__';
import { ErrorFallback } from '../error-fallback';
import { useStyles } from './Page.style';
import { PageDesigner, PageTabDesigner } from './PageTabDesigner';

export const Page = (props) => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const dn = useDesignable();
  const { theme } = useGlobalTheme();
  const { getAriaLabel } = useGetAriaLabelOfSchemaInitializer();
  const { tabUid, name: pageUid } = useParams();
  const basenameOfCurrentRouter = useRouterBasename();

  const disablePageHeader = fieldSchema['x-component-props']?.disablePageHeader;
  const enablePageTabs = fieldSchema['x-component-props']?.enablePageTabs;
  const options = useContext(SchemaOptionsContext);
  const navigate = useNavigateNoUpdate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const activeKey = useMemo(
    // 处理 searchParams 是为了兼容旧版的 tab 参数
    () => tabUid || searchParams.get('tab') || Object.keys(fieldSchema.properties || {}).shift(),
    [fieldSchema.properties, searchParams, tabUid],
  );
  const { wrapSSR, hashId, componentCls } = useStyles();
  const aclStyles = useAClStyles();
  const { token } = useToken();

  const handleErrors = useCallback((error) => {
    console.error(error);
  }, []);

  const footer = useMemo(() => {
    return enablePageTabs ? (
      <DndContext>
        <Tabs
          size={'small'}
          activeKey={activeKey}
          // 这里的样式是为了保证页面 tabs 标签下面的分割线和页面内容对齐（页面内边距可以通过主题编辑器调节）
          tabBarStyle={{
            paddingLeft: token.paddingLG - token.paddingPageHorizontal,
            paddingRight: token.paddingLG - token.paddingPageHorizontal,
            marginLeft: token.paddingPageHorizontal - token.paddingLG,
            marginRight: token.paddingPageHorizontal - token.paddingLG,
          }}
          onChange={(activeKey) => {
            setLoading(true);
            navigateToTab({ activeKey, navigate, basename: basenameOfCurrentRouter });
            setTimeout(() => {
              setLoading(false);
            }, 50);
          }}
          tabBarExtraContent={
            dn.designable && (
              <Button
                aria-label={getAriaLabel('tabs')}
                icon={<PlusOutlined />}
                className={'addTabBtn'}
                type={'dashed'}
                onClick={async () => {
                  const values = await FormDialog(
                    t('Add tab'),
                    () => {
                      return (
                        <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
                          <FormLayout layout={'vertical'}>
                            <SchemaComponent
                              schema={{
                                properties: {
                                  title: {
                                    title: t('Tab name'),
                                    'x-component': 'Input',
                                    'x-decorator': 'FormItem',
                                    required: true,
                                  },
                                  icon: {
                                    title: t('Icon'),
                                    'x-component': 'IconPicker',
                                    'x-decorator': 'FormItem',
                                  },
                                },
                              }}
                            />
                          </FormLayout>
                        </SchemaComponentOptions>
                      );
                    },
                    theme,
                  ).open({
                    initialValues: {},
                  });
                  const { title, icon } = values;
                  dn.insertBeforeEnd({
                    type: 'void',
                    title,
                    'x-icon': icon,
                    'x-component': 'Grid',
                    'x-initializer': 'page:addBlock',
                    properties: {},
                  });
                }}
              >
                {t('Add tab')}
              </Button>
            )
          }
          items={fieldSchema.mapProperties((schema) => {
            return {
              label: (
                <SortableItem
                  id={schema.name as string}
                  schema={schema}
                  className={classNames('nb-action-link', 'designerCss', props.className)}
                >
                  {schema['x-icon'] && <Icon style={{ marginRight: 8 }} type={schema['x-icon']} />}
                  <span>{schema.title || t('Unnamed')}</span>
                  <PageTabDesigner schema={schema} />
                </SortableItem>
              ),
              key: schema.name as string,
            };
          })}
        />
      </DndContext>
    ) : null;
  }, [
    activeKey,
    fieldSchema,
    dn.designable,
    options.scope,
    options.components,
    pageUid,
    fieldSchema.mapProperties((schema) => schema.title || t('Unnamed')).join(),
    enablePageTabs,
  ]);

  return wrapSSR(
    <div className={`${componentCls} ${hashId} ${aclStyles.styles}`}>
      <NocoBasePageHeader footer={footer} />
      <div className="nb-page-wrapper">
        <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleErrors}>
          {tabUid ? (
            // used to match the rout with name "admin.page.tab"
            <Outlet context={{ loading, disablePageHeader, enablePageTabs, fieldSchema, tabUid }} />
          ) : (
            <>
              <PageContent
                loading={loading}
                disablePageHeader={disablePageHeader}
                enablePageTabs={enablePageTabs}
                fieldSchema={fieldSchema}
                activeKey={activeKey}
              />
              {/* Used to match the route with name "admin.page.popup" */}
              <Outlet />
            </>
          )}
        </ErrorBoundary>
      </div>
    </div>,
  );
};

export const PageTabs = () => {
  const { loading, disablePageHeader, enablePageTabs, fieldSchema, tabUid } = useOutletContext<any>();
  return (
    <>
      <PageContent
        loading={loading}
        disablePageHeader={disablePageHeader}
        enablePageTabs={enablePageTabs}
        fieldSchema={fieldSchema}
        activeKey={tabUid}
      />
      {/* used to match the route with name "admin.page.tab.popup" */}
      <Outlet />
    </>
  );
};

Page.displayName = 'Page';

const className1 = css`
  > .nb-grid-container:not(:last-child) {
    > .nb-grid > .nb-grid-warp > button:last-child {
      display: none;
    }
  }
`;

const PageContent = memo(
  ({
    loading,
    disablePageHeader,
    enablePageTabs,
    fieldSchema,
    activeKey,
  }: {
    loading: boolean;
    disablePageHeader: any;
    enablePageTabs: any;
    fieldSchema: Schema<any, any, any, any, any, any, any, any, any>;
    activeKey: string;
  }) => {
    const { render } = useAppSpin();

    if (loading) {
      return render();
    }

    return (
      <>
        {!disablePageHeader && enablePageTabs ? (
          fieldSchema.mapProperties((schema) => {
            if (schema.name !== activeKey) return null;

            return (
              <SchemaComponent
                distributed
                schema={
                  new Schema({
                    properties: {
                      [schema.name]: schema,
                    },
                  })
                }
              />
            );
          })
        ) : (
          <div className={classNames(`pageWithFixedBlockCss nb-page-content`, className1)}>
            <SchemaComponent schema={fieldSchema} distributed />
          </div>
        )}
      </>
    );
  },
);
PageContent.displayName = 'PageContent';

function NocoBasePageHeader({ footer }: { footer: React.JSX.Element }) {
  const fieldSchema = useFieldSchema();
  const { title, setTitle } = useDocumentTitle();
  const { t } = useTranslation();

  const disablePageHeader = fieldSchema['x-component-props']?.disablePageHeader;
  const enablePageTabs = fieldSchema['x-component-props']?.enablePageTabs;
  const hidePageTitle = fieldSchema['x-component-props']?.hidePageTitle;

  useEffect(() => {
    if (fieldSchema.title) {
      setTitle(t(fieldSchema.title));
    }
  }, [fieldSchema.title, setTitle, t]);

  useRequest(
    {
      url: `/uiSchemas:getParentJsonSchema/${fieldSchema['x-uid']}`,
    },
    {
      ready: !hidePageTitle && !fieldSchema.title,
      onSuccess(data) {
        setTitle(data.data.title);
      },
    },
  );

  return (
    <>
      <PageDesigner title={fieldSchema.title || title} />
      {!disablePageHeader && (
        <AntdPageHeader
          className={classNames('pageHeaderCss', title || enablePageTabs ? '' : 'height0')}
          ghost={false}
          // 如果标题为空的时候会导致 PageHeader 不渲染，所以这里设置一个空白字符，然后再设置高度为 0
          title={title || ' '}
          footer={footer}
        />
      )}
    </>
  );
}

export function navigateToTab({
  activeKey,
  navigate,
  basename,
  pathname = window.location.pathname,
}: {
  activeKey: string;
  navigate: NavigateFunction;
  /** the router basename */
  basename: string;
  pathname?: string;
}) {
  pathname = pathname.replace(basename, '');

  if (pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }

  if (isTabPage(pathname)) {
    navigate(`${pathname.replace(/\/tabs\/[^/]+$/, `/tabs/${activeKey}`)}`, { replace: true });
  } else {
    navigate(`${pathname}/tabs/${activeKey}`, { replace: true });
  }
}

export function isTabPage(pathname: string) {
  if (pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  const list = pathname.split('/');
  return list[list.length - 2] === 'tabs';
}
