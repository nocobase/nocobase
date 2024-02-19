import { PlusOutlined } from '@ant-design/icons';
import { PageHeader as AntdPageHeader } from '@ant-design/pro-layout';
import { FormLayout } from '@formily/antd-v5';
import { Schema, SchemaOptionsContext, useFieldSchema } from '@formily/react';
import { Button, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FormDialog } from '..';
import { useStyles as useAClStyles } from '../../../acl/style';
import { useAppSpin } from '../../../application/hooks/useAppSpin';
import { useDocumentTitle } from '../../../document-title';
import { FilterBlockProvider } from '../../../filter-provider/FilterProvider';
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
import { PageDesigner, PageTabDesigner } from './PageTabDesigner';
import { useStyles } from './style';

export const Page = (props) => {
  const { children, ...others } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const fieldSchema = useFieldSchema();
  const { title = fieldSchema.title } = useDocumentTitle();
  const dn = useDesignable();
  const { theme } = useGlobalTheme();
  const { getAriaLabel } = useGetAriaLabelOfSchemaInitializer();
  const disablePageHeader = fieldSchema['x-component-props']?.disablePageHeader;
  const enablePageTabs = fieldSchema['x-component-props']?.enablePageTabs;
  const hidePageTitle = fieldSchema['x-component-props']?.hidePageTitle;
  const options = useContext(SchemaOptionsContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const activeKey = useMemo(
    () => searchParams.get('tab') || Object.keys(fieldSchema.properties || {}).shift(),
    [fieldSchema.properties, searchParams],
  );
  const { wrapSSR, hashId, componentCls } = useStyles();
  const aclStyles = useAClStyles();
  const headerRef = useRef(null);
  const headerHeightRef = useRef(0);

  useEffect(() => {
    headerHeightRef.current = Math.floor(headerRef.current?.getBoundingClientRect().height || 0) + 1;
  }, []);

  const handleErrors = (error) => {
    console.error(error);
  };

  const pageHeaderTitle = hidePageTitle ? undefined : fieldSchema.title || compile(title);
  return wrapSSR(
    <FilterBlockProvider>
      <div className={`${componentCls} ${hashId} ${aclStyles.styles}`}>
        <PageDesigner title={fieldSchema.title || title} />
        <div ref={headerRef}>
          {!disablePageHeader && (
            <AntdPageHeader
              className={classNames('pageHeaderCss', pageHeaderTitle || enablePageTabs ? '' : 'height0')}
              ghost={false}
              // 如果标题为空的时候会导致 PageHeader 不渲染，所以这里设置一个空白字符，然后再设置高度为 0
              title={pageHeaderTitle || ' '}
              {...others}
              footer={
                enablePageTabs && (
                  <DndContext>
                    <Tabs
                      size={'small'}
                      activeKey={activeKey}
                      onTabClick={(activeKey) => {
                        setLoading(true);
                        setSearchParams([['tab', activeKey]]);
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
                                    <SchemaComponentOptions
                                      scope={options.scope}
                                      components={{ ...options.components }}
                                    >
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
                                'x-initializer': 'BlockInitializers',
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
              }
            />
          )}
        </div>
        <div className="nb-page-wrapper">
          <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleErrors}>
            {PageContent(
              loading,
              disablePageHeader,
              enablePageTabs,
              fieldSchema,
              activeKey,
              headerHeightRef.current,
              props,
            )}
          </ErrorBoundary>
        </div>
      </div>
    </FilterBlockProvider>,
  );
};

Page.displayName = 'Page';

function PageContent(
  loading: boolean,
  disablePageHeader: any,
  enablePageTabs: any,
  fieldSchema: Schema<any, any, any, any, any, any, any, any, any>,
  activeKey: string,
  height: number,
  props: any,
): React.ReactNode {
  const { token } = useToken();
  const { render } = useAppSpin();

  if (loading) {
    return render();
  }

  return !disablePageHeader && enablePageTabs ? (
    fieldSchema.mapProperties((schema) => {
      if (schema.name !== activeKey) return null;

      return (
        <FixedBlock key={schema.name} height={`calc(${height}px + 46px + ${token.marginLG}px * 2)`}>
          <SchemaComponent
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
    <FixedBlock height={`calc(${height}px + 46px + ${token.marginLG}px * 2)`}>
      <div className={`pageWithFixedBlockCss nb-page-content`}>{props.children}</div>
    </FixedBlock>
  );
}
