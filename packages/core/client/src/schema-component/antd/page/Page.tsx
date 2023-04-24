import { PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { FormDialog, FormLayout } from '@formily/antd';
import { Schema, SchemaOptionsContext, useFieldSchema } from '@formily/react';
import { PageHeader as AntdPageHeader, Button, Spin, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useContext, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../../../document-title';
import { FilterBlockProvider } from '../../../filter-provider/FilterProvider';
import { Icon } from '../../../icon';
import { DndContext } from '../../common';
import { SortableItem } from '../../common/sortable-item';
import { SchemaComponent, SchemaComponentOptions } from '../../core';
import { useCompile, useDesignable } from '../../hooks';
import { ErrorFallback } from '../error-fallback';
import FixedBlock from './FixedBlock';
import { PageDesigner, PageTabDesigner } from './PageTabDesigner';

const designerCss = css`
  position: relative;
  &:hover {
    > .general-schema-designer {
      display: block;
    }
  }
  &.nb-action-link {
    > .general-schema-designer {
      top: var(--nb-designer-offset);
      bottom: var(--nb-designer-offset);
      right: var(--nb-designer-offset);
      left: var(--nb-designer-offset);
    }
  }
  > .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: rgba(241, 139, 98, 0.06);
    border: 0;
    pointer-events: none;
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: #f18b62;
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
      }
    }
  }
`;

const pageDesignerCss = css`
  position: relative;
  z-index: 20;
  flex: 1;
  display: flex;
  flex-direction: column;

  &:hover {
    > .general-schema-designer {
      display: block;
    }
  }
  .ant-page-header {
    z-index: 1;
    position: relative;
  }
  > .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    /* background: rgba(241, 139, 98, 0.06); */
    border: 0;
    pointer-events: none;
    > .general-schema-designer-icons {
      z-index: 9999;
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: #f18b62;
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
      }
    }
  }
`;

const pageWithFixedBlockCss = classNames([
  'nb-page-content',
  css`
    height: 100%;
    > .nb-grid:not(:last-child) {
      > .nb-schema-initializer-button {
        display: none;
      }
    }
  `,
]);

export const Page = (props) => {
  const { children, ...others } = props;
  const compile = useCompile();
  const { title, setTitle } = useDocumentTitle();
  const fieldSchema = useFieldSchema();
  const dn = useDesignable();
  useEffect(() => {
    if (!title) {
      setTitle(fieldSchema.title);
    }
  }, [fieldSchema.title, title]);
  const disablePageHeader = fieldSchema['x-component-props']?.disablePageHeader;
  const enablePageTabs = fieldSchema['x-component-props']?.enablePageTabs;
  const hidePageTitle = fieldSchema['x-component-props']?.hidePageTitle;
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const location = useLocation<any>();
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(() => {
    // @ts-ignore
    return location?.query?.tab || Object.keys(fieldSchema.properties).shift();
  });

  const [height, setHeight] = useState(0);

  const handleErrors = (error) => {
    console.error(error);
  };

  return (
    <FilterBlockProvider>
      <div className={pageDesignerCss}>
        <PageDesigner title={fieldSchema.title || title} />
        <div
          ref={(ref) => {
            setHeight(Math.floor(ref?.getBoundingClientRect().height || 0) + 1);
          }}
        >
          {!disablePageHeader && (
            <AntdPageHeader
              className={css`
                &.has-footer {
                  padding-top: 12px;
                  .ant-page-header-heading-left {
                    /* margin: 0; */
                  }
                  .ant-page-header-footer {
                    margin-top: 0;
                  }
                }
              `}
              ghost={false}
              title={hidePageTitle ? undefined : fieldSchema.title || compile(title)}
              {...others}
              footer={
                enablePageTabs && (
                  <DndContext>
                    <Tabs
                      size={'small'}
                      activeKey={activeKey}
                      onTabClick={(activeKey) => {
                        setLoading(true);
                        setActiveKey(activeKey);
                        window.history.pushState({}, '', window.location.pathname + `?tab=` + activeKey);
                        setTimeout(() => {
                          setLoading(false);
                        }, 50);
                      }}
                      tabBarExtraContent={
                        dn.designable && (
                          <Button
                            icon={<PlusOutlined />}
                            className={css`
                              border-color: rgb(241, 139, 98) !important;
                              color: rgb(241, 139, 98) !important;
                            `}
                            type={'dashed'}
                            onClick={async () => {
                              const values = await FormDialog(t('Add tab'), () => {
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
                              }).open({
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
                    >
                      {fieldSchema.mapProperties((schema) => {
                        return (
                          <Tabs.TabPane
                            tab={
                              <SortableItem
                                id={schema.name}
                                schema={schema}
                                className={classNames('nb-action-link', designerCss, props.className)}
                              >
                                {schema['x-icon'] && <Icon style={{ marginRight: 8 }} type={schema['x-icon']} />}
                                <span>{schema.title || t('Unnamed')}</span>
                                <PageTabDesigner schema={schema} />
                              </SortableItem>
                            }
                            key={schema.name}
                          />
                        );
                      })}
                    </Tabs>
                  </DndContext>
                )
              }
            />
          )}
        </div>
        <div className="nb-page-wrapper" style={{ margin: 'var(--nb-spacing)', flex: 1, }}>
          <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleErrors}>
            {loading ? (
              <Spin />
            ) : !disablePageHeader && enablePageTabs ? (
              fieldSchema.mapProperties((schema) => {
                if (schema.name !== activeKey) return null;
                return (
                  <FixedBlock
                    key={schema.name}
                    height={
                      // header 46 margin --nb-spacing * 2
                      `calc(${height}px + 46px + var(--nb-spacing) * 2)`
                    }
                  >
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
              <FixedBlock
                height={
                  // header 46 margin --nb-spacing * 2
                  `calc(${height}px + 46px + var(--nb-spacing) * 2)`
                }
              >
                <div className={pageWithFixedBlockCss}>{props.children}</div>
              </FixedBlock>
            )}
          </ErrorBoundary>
        </div>
      </div>
    </FilterBlockProvider>
  );
};
