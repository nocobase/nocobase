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
import { SchemaOptionsContext, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { transformMultiColumnToSingleColumn } from '@nocobase/utils/client';
import { Button, Tabs } from 'antd';
import classNames from 'classnames';
import React, { FC, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { NavigateFunction, Outlet, useOutletContext } from 'react-router-dom';
import { FormDialog, withSearchParams } from '..';
import { antTableCell } from '../../../acl/style';
import {
  CurrentTabUidContext,
  useCurrentSearchParams,
  useCurrentTabUid,
  useLocationNoUpdate,
  useNavigateNoUpdate,
  useRouterBasename,
} from '../../../application/CustomRouterContextProvider';
import { AppNotFound } from '../../../common/AppNotFound';
import { useDocumentTitle } from '../../../document-title';
import { useGlobalTheme } from '../../../global-theme';
import { Icon } from '../../../icon';
import {
  NocoBaseDesktopRouteType,
  NocoBaseRouteContext,
  useCurrentRoute,
  useMobileLayout,
} from '../../../route-switch/antd/admin-layout';
import { KeepAlive, useKeepAlive } from '../../../route-switch/antd/admin-layout/KeepAlive';
import { useGetAriaLabelOfSchemaInitializer } from '../../../schema-initializer/hooks/useGetAriaLabelOfSchemaInitializer';
import { DndContext } from '../../common';
import { SortableItem } from '../../common/sortable-item';
import { RemoteSchemaComponent, SchemaComponent, SchemaComponentOptions } from '../../core';
import { useCompile, useDesignable } from '../../hooks';
import { useToken } from '../__builtins__';
import { ErrorFallback } from '../error-fallback';
import { useMenuDragEnd, useNocoBaseRoutes } from '../menu/Menu';
import { AllDataBlocksProvider } from './AllDataBlocksProvider';
import { useStyles } from './Page.style';
import { PageDesigner, PageTabDesigner } from './PageTabDesigner';
import { PopupRouteContextResetter } from './PopupRouteContextResetter';
import { NAMESPACE_UI_SCHEMA } from '../../../i18n/constant';

interface PageProps {
  currentTabUid: string;
  className?: string;
}

const useRouteTranslation = () => {
  return useTranslation('lm-desktop-routes');
};

const InternalPage = React.memo((props: PageProps) => {
  const fieldSchema = useFieldSchema();
  const currentTabUid = props.currentTabUid;
  const disablePageHeader = fieldSchema['x-component-props']?.disablePageHeader;
  const searchParams = useCurrentSearchParams();
  const loading = false;
  const currentRoute = useCurrentRoute();
  const enablePageTabs = currentRoute.enableTabs;
  const defaultActiveKey = currentRoute?.children?.[0]?.schemaUid;

  const activeKey = useMemo(
    // 处理 searchParams 是为了兼容旧版的 tab 参数
    () => currentTabUid || searchParams.get('tab') || defaultActiveKey,
    [currentTabUid, searchParams, defaultActiveKey],
  );

  const outletContext = useMemo(
    () => ({ loading, disablePageHeader, enablePageTabs, tabUid: currentTabUid }),
    [currentTabUid, disablePageHeader, enablePageTabs, loading],
  );

  return (
    <>
      <NocoBasePageHeader activeKey={activeKey} className={props.className} />
      <div className="nb-page-wrapper">
        <ErrorBoundary FallbackComponent={ErrorFallback} onError={console.error}>
          {currentTabUid ? (
            // used to match the rout with name "admin.page.tab"
            <Outlet context={outletContext} />
          ) : (
            <>
              <PageContent
                loading={loading}
                disablePageHeader={disablePageHeader}
                enablePageTabs={enablePageTabs}
                activeKey={activeKey}
              />
              {/* Used to match the route with name "admin.page.popup" */}
              <Outlet />
            </>
          )}
        </ErrorBoundary>
      </div>
    </>
  );
});

export const Page = React.memo((props: PageProps) => {
  const { hashId, componentCls } = useStyles();
  const { active: pageActive } = useKeepAlive();
  const currentTabUid = useCurrentTabUid();
  const tabUidRef = useRef(currentTabUid);

  if (pageActive) {
    tabUidRef.current = currentTabUid;
  }

  return (
    <AllDataBlocksProvider>
      <div className={`${componentCls} ${hashId} ${antTableCell}`}>
        {/* Avoid passing values down to improve rendering performance */}
        <CurrentTabUidContext.Provider value={''}>
          <InternalPage currentTabUid={tabUidRef.current} className={props.className} />
        </CurrentTabUidContext.Provider>
      </div>
    </AllDataBlocksProvider>
  );
});

Page.displayName = 'NocoBasePage';

export const PageTabs = () => {
  const { loading, disablePageHeader, enablePageTabs, tabUid } = useOutletContext<any>();
  return (
    <CurrentTabUidContext.Provider value={tabUid}>
      <PageContent
        loading={loading}
        disablePageHeader={disablePageHeader}
        enablePageTabs={enablePageTabs}
        activeKey={tabUid}
      />
      {/* used to match the route with name "admin.page.tab.popup" */}
      <Outlet />
    </CurrentTabUidContext.Provider>
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

interface PageContentProps {
  loading: boolean;
  disablePageHeader: any;
  enablePageTabs: any;
  activeKey: string;
}

const InternalPageContent = (props: PageContentProps) => {
  const { loading, disablePageHeader, enablePageTabs, activeKey } = props;
  const currentRoute = useCurrentRoute();
  const navigate = useNavigateNoUpdate();
  const location = useLocationNoUpdate();
  const { isMobileLayout } = useMobileLayout();

  const children = currentRoute?.children || [];
  const noTabs = children.every((tabRoute) => tabRoute.schemaUid !== activeKey && tabRoute.tabSchemaName !== activeKey);

  if (activeKey && noTabs) {
    return <AppNotFound />;
  }

  // 兼容旧版本的 tab 路径
  const oldTab = currentRoute?.children?.find((tabRoute) => tabRoute.tabSchemaName === activeKey);
  if (oldTab) {
    const searchParams = new URLSearchParams(location.search);
    // Check if activeKey exists in search params and remove it
    if (searchParams.has('tab') && searchParams.get('tab') === activeKey) {
      searchParams.delete('tab');
    }
    // Create a clean search string or empty string if only '?' remains
    const searchString = searchParams.toString() ? `?${searchParams.toString()}` : '';

    const newPath =
      location.pathname + (location.pathname.endsWith('/') ? `tabs/${oldTab.schemaUid}` : `/tabs/${oldTab.schemaUid}`);
    navigate(newPath + searchString);

    return null;
  }

  if (!disablePageHeader && enablePageTabs) {
    return (
      <KeepAlive uid={activeKey}>
        {(uid) => (
          <NocoBaseRouteContext.Provider value={currentRoute.children?.find((item) => item.schemaUid === uid)}>
            <RemoteSchemaComponent
              uid={uid}
              schemaTransform={isMobileLayout ? transformMultiColumnToSingleColumn : undefined}
            />
          </NocoBaseRouteContext.Provider>
        )}
      </KeepAlive>
    );
  }

  return (
    <div className={className1}>
      <NocoBaseRouteContext.Provider value={currentRoute?.children?.[0]}>
        <RemoteSchemaComponent
          uid={currentRoute?.children?.[0].schemaUid}
          schemaTransform={isMobileLayout ? transformMultiColumnToSingleColumn : undefined}
        />
      </NocoBaseRouteContext.Provider>
    </div>
  );
};

const PageContent = memo((props: PageContentProps) => {
  return (
    <PopupRouteContextResetter>
      <InternalPageContent {...props} />
    </PopupRouteContextResetter>
  );
});

const NocoBasePageHeaderTabs: FC<{ className: string; activeKey: string }> = ({ className, activeKey }) => {
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { t: routeT } = useRouteTranslation();
  const { token } = useToken();
  const basenameOfCurrentRouter = useRouterBasename();
  const navigate = useNavigateNoUpdate();
  const handleTabsChange = useCallback(
    (activeKey: string): void => {
      navigateToTab({ activeKey, navigate, basename: basenameOfCurrentRouter });
    },
    [basenameOfCurrentRouter, navigate],
  );
  const dn = useDesignable();
  const { getAriaLabel } = useGetAriaLabelOfSchemaInitializer();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const currentRoute = useCurrentRoute();
  const { createRoute } = useNocoBaseRoutes();
  const compile = useCompile();

  const tabBarExtraContent = useMemo(() => {
    return (
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
            const schemaUid = uid();
            const tabSchemaName = uid();

            await createRoute({
              type: NocoBaseDesktopRouteType.tabs,
              schemaUid,
              title: title || '{{t("Unnamed")}}',
              icon,
              parentId: currentRoute.id,
              tabSchemaName,
            });

            dn.insertBeforeEnd(getTabSchema({ title, icon, schemaUid, tabSchemaName }));
          }}
        >
          {t('Add tab')}
        </Button>
      )
    );
  }, [dn, getAriaLabel, options?.components, options?.scope, t, theme]);

  const enablePageTabs = currentRoute.enableTabs;

  // 这里的样式是为了保证页面 tabs 标签下面的分割线和页面内容对齐（页面内边距可以通过主题编辑器调节）
  const tabBarStyle = useMemo(
    () => ({
      paddingLeft: token.paddingLG - token.paddingPageHorizontal,
      paddingRight: token.paddingLG - token.paddingPageHorizontal,
      marginLeft: token.paddingPageHorizontal - token.paddingLG,
      marginRight: token.paddingPageHorizontal - token.paddingLG,
    }),
    [token.paddingLG, token.paddingPageHorizontal],
  );

  const items = useMemo(() => {
    return currentRoute?.children
      ?.map((tabRoute) => {
        if (!tabRoute || tabRoute.hideInMenu) {
          return null;
        }

        // fake schema used to pass routing information to SortableItem
        const fakeSchema: any = { __route__: tabRoute };

        return {
          label: (
            <NocoBaseRouteContext.Provider value={tabRoute}>
              <SortableItem
                id={String(tabRoute.id)}
                className={classNames('nb-action-link', 'designerCss', className)}
                schema={fakeSchema}
              >
                {tabRoute.icon && <Icon style={{ marginRight: 8 }} type={tabRoute.icon} />}
                <span>{(tabRoute.title && routeT(compile(tabRoute.title))) || t('Unnamed')}</span>
                <PageTabDesigner />
              </SortableItem>
            </NocoBaseRouteContext.Provider>
          ),
          key: tabRoute.schemaUid,
        };
      })
      .filter(Boolean);
  }, [
    fieldSchema,
    className,
    t,
    fieldSchema.mapProperties((schema) => schema.title || t('Unnamed')).join(),
    currentRoute,
  ]);

  const { onDragEnd } = useMenuDragEnd();

  return enablePageTabs ? (
    <DndContext onDragEnd={onDragEnd}>
      <Tabs
        size={'small'}
        activeKey={activeKey}
        tabBarStyle={tabBarStyle}
        onChange={handleTabsChange}
        tabBarExtraContent={tabBarExtraContent}
        items={items}
      />
    </DndContext>
  ) : null;
};

const NocoBasePageHeader = React.memo(({ activeKey, className }: { activeKey: string; className: string }) => {
  const fieldSchema = useFieldSchema();
  const { setTitle: setDocumentTitle } = useDocumentTitle();
  const { t } = useTranslation();
  const { t: routeT } = useRouteTranslation();
  const [pageTitle, setPageTitle] = useState(() => t(fieldSchema.title));

  const disablePageHeader = fieldSchema['x-component-props']?.disablePageHeader;
  const currentRoute = useCurrentRoute();
  const enablePageTabs = currentRoute.enableTabs;
  const hidePageTitle = fieldSchema['x-component-props']?.hidePageTitle;

  const { token } = useToken();

  useEffect(() => {
    const title =
      t(fieldSchema.title, { ns: NAMESPACE_UI_SCHEMA }) || t(currentRoute?.title, { ns: NAMESPACE_UI_SCHEMA });
    if (title) {
      setDocumentTitle(title);
      setPageTitle(title);
    }
  }, [fieldSchema.title, pageTitle, setDocumentTitle, t, currentRoute?.title]);

  return (
    <>
      <PageDesigner title={pageTitle} />
      {!disablePageHeader && (
        <AntdPageHeader
          className={classNames('pageHeaderCss', pageTitle || enablePageTabs ? '' : 'height0')}
          style={{
            paddingBottom: currentRoute.enableTabs || hidePageTitle ? 0 : token.paddingSM,
          }}
          ghost={false}
          // 如果标题为空的时候会导致 PageHeader 不渲染，所以这里设置一个空白字符，然后再设置高度为 0
          title={hidePageTitle ? ' ' : (!fieldSchema.title && pageTitle ? routeT(pageTitle) : pageTitle) || ' '}
          footer={<NocoBasePageHeaderTabs className={className} activeKey={activeKey} />}
        />
      )}
    </>
  );
});

NocoBasePageHeader.displayName = 'NocoBasePageHeader';

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
    navigate(withSearchParams(`${pathname.replace(/\/tabs\/[^/]+$/, `/tabs/${activeKey}`)}`), { replace: true });
  } else {
    navigate(withSearchParams(`${pathname}/tabs/${activeKey}`), { replace: true });
  }
}

export function isTabPage(pathname: string) {
  if (pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  const list = pathname.split('/');
  return list[list.length - 2] === 'tabs';
}

export function getTabSchema({
  title,
  icon,
  schemaUid,
  tabSchemaName,
}: {
  title: string;
  icon: string;
  schemaUid: string;
  tabSchemaName: string;
}) {
  return {
    type: 'void',
    name: tabSchemaName,
    title,
    'x-icon': icon,
    'x-component': 'Grid',
    'x-initializer': 'page:addBlock',
    properties: {},
    'x-uid': schemaUid,
    'x-async': true,
  };
}
