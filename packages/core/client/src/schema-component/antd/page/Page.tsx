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
import { FormLayout } from '@formily/antd-v5';
import { Schema, SchemaOptionsContext, useFieldSchema } from '@formily/react';
import { Button, Tabs } from 'antd';
import classNames from 'classnames';
import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { Outlet, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { FormDialog } from '..';
import { useStyles as useAClStyles } from '../../../acl/style';
import { useRequest } from '../../../api-client';
import { useNavigateNoUpdate } from '../../../application/CustomRouterContextProvider';
import { useAppSpin } from '../../../application/hooks/useAppSpin';
import { useDocumentTitle } from '../../../document-title';
import { useGlobalTheme } from '../../../global-theme';
import { Icon } from '../../../icon';
import { useGetAriaLabelOfSchemaInitializer } from '../../../schema-initializer/hooks/useGetAriaLabelOfSchemaInitializer';
import { DndContext } from '../../common';
import { SortableItem } from '../../common/sortable-item';
import { SchemaComponent, SchemaComponentOptions } from '../../core';
import { useCompile, useDesignable } from '../../hooks';
import { useToken } from '../__builtins__';
import { ErrorFallback } from '../error-fallback';
import FixedBlock from './FixedBlock';
import { useStyles } from './Page.style';
import { PageDesigner, PageTabDesigner } from './PageTabDesigner';

export const Page = (props) => {
  const { children, ...others } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const { title, setTitle } = useDocumentTitle();
  const fieldSchema = useFieldSchema();
  const dn = useDesignable();
  const { theme } = useGlobalTheme();
  const { getAriaLabel } = useGetAriaLabelOfSchemaInitializer();
  const { tabUid, name: pageUid } = useParams();

  // react18  tab 动画会卡顿，所以第一个 tab 时，动画禁用，后面的 tab 才启用
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setHasMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!title) {
      setTitle(t(fieldSchema.title));
    }
  }, [fieldSchema.title, title]);
  const disablePageHeader = fieldSchema['x-component-props']?.disablePageHeader;
  const enablePageTabs = fieldSchema['x-component-props']?.enablePageTabs;
  const hidePageTitle = fieldSchema['x-component-props']?.hidePageTitle;
  const options = useContext(SchemaOptionsContext);
  const navigate = useNavigateNoUpdate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const activeKey = useMemo(
    // 处理 searchParams 是为了兼容旧版的 tab 参数
    () => tabUid || searchParams.get('tab') || Object.keys(fieldSchema.properties || {}).shift(),
    [fieldSchema.properties, searchParams, tabUid],
  );
  const [height, setHeight] = useState(0);
  const { wrapSSR, hashId, componentCls } = useStyles();
  const aclStyles = useAClStyles();
  const { token } = useToken();

  const pageHeaderTitle = hidePageTitle ? undefined : fieldSchema.title || compile(title);

  useRequest(
    {
      url: `/uiSchemas:getParentJsonSchema/${fieldSchema['x-uid']}`,
    },
    {
      ready: !hidePageTitle && !pageHeaderTitle,
      onSuccess(data) {
        setTitle(data.data.title);
      },
    },
  );

  const handleErrors = useCallback((error) => {
    console.error(error);
  }, []);

  const footer = useMemo(() => {
    return (
      enablePageTabs && (
        <DndContext>
          <Tabs
            size={'small'}
            animated={hasMounted}
            activeKey={activeKey}
            // 这里的样式是为了保证页面 tabs 标签下面的分割线和页面内容对齐（页面内边距可以通过主题编辑器调节）
            tabBarStyle={{
              paddingLeft: token.paddingLG - token.paddingPageHorizontal,
              paddingRight: token.paddingLG - token.paddingPageHorizontal,
              marginLeft: token.paddingPageHorizontal - token.paddingLG,
              marginRight: token.paddingPageHorizontal - token.paddingLG,
            }}
            onTabClick={(activeKey) => {
              setLoading(true);
              navigate(`/admin/${pageUid}/tabs/${activeKey}`);
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
      )
    );
  }, [hasMounted, activeKey, fieldSchema, dn.designable, options.scope, options.components, pageUid]);

  return wrapSSR(
    <div className={`${componentCls} ${hashId} ${aclStyles.styles}`}>
      <PageDesigner title={fieldSchema.title || title} />
      <div
        ref={(ref) => {
          setHeight(Math.floor(ref?.getBoundingClientRect().height || 0) + 1);
        }}
      >
        {!disablePageHeader && (
          <AntdPageHeader
            className={classNames('pageHeaderCss', pageHeaderTitle || enablePageTabs ? '' : 'height0')}
            ghost={false}
            // 如果标题为空的时候会导致 PageHeader 不渲染，所以这里设置一个空白字符，然后再设置高度为 0
            title={pageHeaderTitle || ' '}
            {...others}
            footer={footer}
          />
        )}
      </div>
      <div className="nb-page-wrapper">
        <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleErrors}>
          {tabUid ? (
            // used to match the rout with name "admin.page.tab"
            <Outlet context={{ loading, disablePageHeader, enablePageTabs, fieldSchema, height, tabUid }} />
          ) : (
            <>
              <PageContent {...{ loading, disablePageHeader, enablePageTabs, fieldSchema, height, activeKey }} />
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
  const { loading, disablePageHeader, enablePageTabs, fieldSchema, height, tabUid } = useOutletContext<any>();
  return (
    <>
      <PageContent {...{ loading, disablePageHeader, enablePageTabs, fieldSchema, activeKey: tabUid, height }} />
      {/* used to match the route with name "admin.page.tab.popup" */}
      <Outlet />
    </>
  );
};

Page.displayName = 'Page';

const PageContent = memo(
  ({
    loading,
    disablePageHeader,
    enablePageTabs,
    fieldSchema,
    activeKey,
    height,
  }: {
    loading: boolean;
    disablePageHeader: any;
    enablePageTabs: any;
    fieldSchema: Schema<any, any, any, any, any, any, any, any, any>;
    activeKey: string;
    height: number;
  }) => {
    const { token } = useToken();
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
              <FixedBlock key={schema.name} height={`calc(${height}px + 46px + ${token.paddingPageVertical}px * 2)`}>
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
              </FixedBlock>
            );
          })
        ) : (
          <FixedBlock height={`calc(${height}px + 46px + ${token.paddingPageVertical}px * 2)`}>
            <div className={`pageWithFixedBlockCss nb-page-content`}>
              <SchemaComponent schema={fieldSchema} distributed />
            </div>
          </FixedBlock>
        )}
      </>
    );
  },
);
PageContent.displayName = 'PageContent';
