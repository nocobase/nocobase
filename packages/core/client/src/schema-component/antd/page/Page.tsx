import { css } from '@emotion/css';
import { FormDialog, FormLayout } from '@formily/antd';
import { RecursionField, SchemaOptionsContext, useField, useFieldSchema } from '@formily/react';
import { Button, PageHeader as AntdPageHeader, Spin, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../../../document-title';
import { Icon } from '../../../icon';
import { SchemaComponent, SchemaComponentOptions } from '../../core';
import { useCompile, useDesignable } from '../../hooks';
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
      top: -10px;
      bottom: -10px;
      left: -10px;
      right: -10px;
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
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
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
  padding-top: 1px;
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
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
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

export const Page = (props) => {
  const { children, ...others } = props;
  const field = useField();
  const compile = useCompile();
  const { title, setTitle } = useDocumentTitle();
  const fieldSchema = useFieldSchema();
  const history = useHistory();
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
  return (
    <>
      <div className={pageDesignerCss}>
        <PageDesigner title={fieldSchema.title || title} />
        {!disablePageHeader && (
          <AntdPageHeader
            className={css`
              &.has-footer {
                padding-top: 14px;
                .ant-page-header-heading-left {
                  margin: 0;
                  .ant-page-header-heading-title {
                    line-height: 1em;
                  }
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
                <Tabs
                  size={'small'}
                  activeKey={activeKey}
                  onTabClick={(activeKey) => {
                    setLoading(true);
                    setActiveKey(activeKey);
                    window.history.pushState({}, '', location.pathname + `?tab=` + activeKey);
                    setTimeout(() => {
                      setLoading(false);
                    }, 50);
                  }}
                  tabBarExtraContent={
                    <Button
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
                      Add tab
                    </Button>
                  }
                >
                  {fieldSchema.mapProperties((schema) => {
                    return (
                      <Tabs.TabPane
                        tab={
                          <span className={classNames('nb-action-link', designerCss, props.className)}>
                            {schema['x-icon'] && <Icon style={{ marginRight: 8 }} type={schema['x-icon']} />}
                            <span>{schema.title || t('Unnamed')}</span>
                            <PageTabDesigner schema={schema} />
                          </span>
                        }
                        key={schema.name}
                      />
                    );
                  })}
                </Tabs>
              )
            }
          />
        )}
        <div style={{ margin: 24 }}>
          {loading ? (
            <Spin />
          ) : !disablePageHeader && enablePageTabs ? (
            <RecursionField
              schema={fieldSchema}
              onlyRenderProperties
              filterProperties={(s) => {
                return s.name === activeKey;
              }}
            />
          ) : (
            <div
              className={css`
                .nb-grid:not(:last-child) {
                  > .nb-schema-initializer-button {
                    display: none;
                  }
                }
              `}
            >
              {props.children}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
