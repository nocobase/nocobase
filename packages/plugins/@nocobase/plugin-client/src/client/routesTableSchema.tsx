/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-disable react-hooks/rules-of-hooks */
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useField, useForm } from '@formily/react';
import {
  css,
  getVariableComponentWithScope,
  NocoBaseDesktopRouteType,
  useActionContext,
  useAPIClient,
  useBlockRequestContext,
  useCollectionRecordData,
  useDataBlockRequestData,
  useDataBlockRequestGetter,
  useRequest,
  useRouterBasename,
  useTableBlockContextBasicValue,
  useToken,
  Variable,
} from '@nocobase/client';
import { uid } from '@nocobase/utils/client';
import { Checkbox, Radio, Tag, Typography } from 'antd';
import _ from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTableBlockProps } from './useTableBlockProps';
import { getSchemaUidByRouteId } from './utils';

const VariableTextArea = getVariableComponentWithScope(Variable.TextArea);

export const createRoutesTableSchema = (collectionName: string, basename: string) => {
  return {
    type: 'void',
    name: uid(),
    'x-decorator': 'TableBlockProvider',
    'x-decorator-props': {
      collection: collectionName,
      action: 'list',
      dragSort: false,
      params: {
        sort: ['createdAt'],
        pageSize: 20,
      },
      treeTable: true,
    },
    properties: {
      actions: {
        type: 'void',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 16,
          },
        },
        properties: {
          refresh: {
            title: "{{t('Refresh')}}",
            'x-action': 'refresh',
            'x-component': 'Action',
            'x-use-component-props': 'useRefreshActionProps',
            'x-component-props': {
              icon: 'ReloadOutlined',
            },
          },
          delete: {
            type: 'void',
            title: '{{t("Delete")}}',
            'x-component': 'Action',
            'x-use-component-props': () => {
              const tableBlockContextBasicValue = useTableBlockContextBasicValue();
              const { resource, service } = useBlockRequestContext();
              return {
                async onClick() {
                  const filterByTk = tableBlockContextBasicValue.field?.data?.selectedRowKeys;
                  if (!filterByTk?.length) {
                    return;
                  }
                  await resource.destroy({
                    filterByTk,
                  });
                  tableBlockContextBasicValue.field.data.selectedRowKeys = [];
                  const currentPage = service.params[0]?.page;
                  const totalPage = service.data?.meta?.totalPage;
                  if (currentPage === totalPage && service.params[0] && currentPage !== 1) {
                    service.params[0].page = currentPage - 1;
                  }
                  service?.refresh?.();
                },
              };
            },
            'x-component-props': {
              confirm: {
                title: "{{t('Delete routes')}}",
                content: "{{t('Are you sure you want to delete it?')}}",
              },
              icon: 'DeleteOutlined',
            },
          },
          hide: {
            type: 'void',
            title: '{{t("在菜单中隐藏")}}',
            'x-component': 'Action',
            'x-use-component-props': () => {
              const tableBlockContextBasicValue = useTableBlockContextBasicValue();
              const { resource, service } = useBlockRequestContext();
              return {
                async onClick() {
                  const filterByTk = tableBlockContextBasicValue.field?.data?.selectedRowKeys;
                  if (!filterByTk?.length) {
                    return;
                  }
                  await resource.update({
                    filterByTk,
                    values: {
                      hideInMenu: true,
                    },
                  });
                  tableBlockContextBasicValue.field.data.clearSelectedRowKeys?.();
                  service?.refresh?.();
                },
              };
            },
            'x-component-props': {
              icon: 'EyeInvisibleOutlined',
            },
          },
          show: {
            type: 'void',
            title: '{{t("在菜单中显示")}}',
            'x-component': 'Action',
            'x-use-component-props': () => {
              const tableBlockContextBasicValue = useTableBlockContextBasicValue();
              const { resource, service } = useBlockRequestContext();
              return {
                async onClick() {
                  const filterByTk = tableBlockContextBasicValue.field?.data?.selectedRowKeys;
                  if (!filterByTk?.length) {
                    return;
                  }
                  await resource.update({
                    filterByTk,
                    values: {
                      hideInMenu: false,
                    },
                  });
                  tableBlockContextBasicValue.field.data.clearSelectedRowKeys?.();
                  service?.refresh?.();
                },
              };
            },
            'x-component-props': {
              icon: 'EyeOutlined',
            },
          },
          create: {
            type: 'void',
            title: '{{t("Add new")}}',
            'x-component': 'Action',
            'x-component-props': {
              type: 'primary',
              icon: 'PlusOutlined',
            },
            properties: {
              drawer: {
                type: 'void',
                'x-component': 'Action.Drawer',
                'x-decorator': 'Form',
                'x-decorator-props': {
                  useValues(options) {
                    return {};
                  },
                },
                title: '{{t("Add new")}}',
                properties: {
                  formSchema: {
                    type: 'void',
                    properties: {
                      type: {
                        type: 'string',
                        title: '{{t("Type")}}',
                        'x-decorator': 'FormItem',
                        'x-component': (props) => {
                          const { t } = useTranslation();
                          return (
                            <Radio.Group {...props}>
                              <Radio value={NocoBaseDesktopRouteType.group}>{t('Group')}</Radio>
                              <Radio value={NocoBaseDesktopRouteType.page}>{t('Page')}</Radio>
                              <Radio value={NocoBaseDesktopRouteType.link}>{t('Link')}</Radio>
                            </Radio.Group>
                          );
                        },
                        default: NocoBaseDesktopRouteType.page,
                        required: true,
                      },
                      title: {
                        type: 'string',
                        title: '{{t("Title")}}',
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                        required: true,
                      },
                      icon: {
                        type: 'string',
                        title: '{{t("Icon")}}',
                        'x-decorator': 'FormItem',
                        'x-component': 'IconPicker',
                      },
                      href: {
                        title: '{{t("URL")}}',
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': VariableTextArea,
                        description: '{{t("Do not concatenate search params in the URL")}}',
                        'x-reactions': {
                          dependencies: ['type'],
                          fulfill: {
                            state: {
                              hidden: '{{$deps[0] !== "link"}}',
                            },
                          },
                        },
                      },
                      params: {
                        type: 'array',
                        'x-component': 'ArrayItems',
                        'x-decorator': 'FormItem',
                        title: `{{t("Search parameters")}}`,
                        items: {
                          type: 'object',
                          properties: {
                            space: {
                              type: 'void',
                              'x-component': 'Space',
                              'x-component-props': {
                                style: {
                                  flexWrap: 'nowrap',
                                  maxWidth: '100%',
                                },
                                className: css`
                                  & > .ant-space-item:first-child,
                                  & > .ant-space-item:last-child {
                                    flex-shrink: 0;
                                  }
                                `,
                              },
                              properties: {
                                name: {
                                  type: 'string',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                  'x-component-props': {
                                    placeholder: `{{t("Name")}}`,
                                  },
                                },
                                value: {
                                  type: 'string',
                                  'x-decorator': 'FormItem',
                                  'x-component': VariableTextArea,
                                  'x-component-props': {
                                    placeholder: `{{t("Value")}}`,
                                    useTypedConstant: true,
                                    changeOnSelect: true,
                                  },
                                },
                                remove: {
                                  type: 'void',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'ArrayItems.Remove',
                                },
                              },
                            },
                          },
                        },
                        'x-reactions': {
                          dependencies: ['type'],
                          fulfill: {
                            state: {
                              hidden: '{{$deps[0] !== "link"}}',
                            },
                          },
                        },
                        properties: {
                          add: {
                            type: 'void',
                            title: `{{t("Add parameter")}}`,
                            'x-component': 'ArrayItems.Addition',
                          },
                        },
                      },
                      hideInMenu: {
                        type: 'boolean',
                        title: '{{t("Show in menu")}}',
                        'x-decorator': 'FormItem',
                        'x-component': (props) => {
                          const [checked, setChecked] = useState(!props.value);
                          const onChange = () => {
                            setChecked(!checked);
                            props.onChange?.(checked);
                          };
                          return <Checkbox checked={checked} onChange={onChange} />;
                        },
                        default: false,
                      },
                    },
                  },
                  footer: {
                    type: 'void',
                    'x-component': 'Action.Drawer.Footer',
                    properties: {
                      cancel: {
                        title: '{{t("Cancel")}}',
                        'x-component': 'Action',
                        'x-component-props': {
                          useAction: '{{ cm.useCancelAction }}',
                        },
                      },
                      submit: {
                        title: '{{t("Submit")}}',
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'primary',
                          useAction: (actionCallback?: (values: any) => void) => {
                            const form = useForm();
                            const field = useField();
                            const ctx = useActionContext();
                            const { getDataBlockRequest } = useDataBlockRequestGetter();
                            const { createRoute } = useCreateRoute(collectionName);
                            const { createRouteSchema } = useCreateRouteSchema();

                            return {
                              async run() {
                                try {
                                  await form.submit();
                                  field.data = field.data || {};
                                  field.data.loading = true;
                                  const schemaUid = await createRouteSchema(form.values);
                                  let options;

                                  if (form.values.href || !_.isEmpty(form.values.params)) {
                                    options = {
                                      href: form.values.href,
                                      params: form.values.params,
                                    };
                                  }

                                  const res = await createRoute({
                                    ..._.omit(form.values, ['href', 'params']),
                                    schemaUid,
                                    options,
                                  });
                                  ctx.setVisible(false);
                                  actionCallback?.(res?.data?.data);
                                  await form.reset();
                                  field.data.loading = false;
                                  getDataBlockRequest()?.refresh();
                                } catch (error) {
                                  if (field.data) {
                                    field.data.loading = false;
                                  }
                                  throw error;
                                }
                              },
                            };
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          filter: {
            'x-action': 'filter',
            type: 'object',
            'x-component': 'Filter.Action',
            title: "{{t('Filter')}}",
            'x-use-component-props': 'useFilterActionProps',
            'x-component-props': {
              icon: 'FilterOutlined',
            },
            'x-align': 'left',
          },
        },
      },
      table: {
        type: 'array',
        'x-component': 'TableV2',
        'x-use-component-props': useTableBlockProps,
        'x-component-props': {
          rowKey: 'id',
          rowSelection: {
            type: 'checkbox',
          },
        },
        properties: {
          title: {
            type: 'void',
            'x-component': 'TableV2.Column',
            title: '{{t("Title")}}',
            'x-component-props': {
              width: 200,
            },
            properties: {
              title: {
                type: 'string',
                'x-component': 'CollectionField',
                'x-read-pretty': true,
                'x-component-props': {
                  ellipsis: true,
                },
              },
            },
          },
          type: {
            type: 'void',
            'x-component': 'TableV2.Column',
            title: '{{t("Type")}}',
            'x-component-props': {
              width: 100,
            },
            properties: {
              type: {
                type: 'string',
                'x-component': (props) => {
                  const colorMap = {
                    [NocoBaseDesktopRouteType.group]: 'blue',
                    [NocoBaseDesktopRouteType.page]: 'green',
                    [NocoBaseDesktopRouteType.link]: 'red',
                    [NocoBaseDesktopRouteType.tabs]: 'orange',
                  };
                  return <Tag color={colorMap[props.value]}> {props.value} </Tag>;
                },
                'x-read-pretty': true,
                'x-component-props': {
                  ellipsis: true,
                },
              },
            },
          },
          hideInMenu: {
            type: 'void',
            'x-component': 'TableV2.Column',
            title: '{{t("Show in menu")}}',
            'x-component-props': {
              width: 100,
            },
            properties: {
              hideInMenu: {
                type: 'boolean',
                'x-component': (props) => {
                  const { token } = useToken();
                  const { t } = useTranslation();
                  return props.value ? (
                    <CloseOutlined style={{ color: '#ff4d4f' }} />
                  ) : (
                    <CheckOutlined style={{ color: '#52c41a' }} />
                  );
                },
                'x-read-pretty': true,
                'x-component-props': {
                  ellipsis: true,
                },
              },
            },
          },
          path: {
            title: '{{t("Path")}}',
            type: 'void',
            'x-component': 'TableV2.Column',
            'x-component-props': {
              width: 300,
            },
            properties: {
              path: {
                type: 'string',
                'x-component': function Com() {
                  const data = useDataBlockRequestData();
                  const recordData = useCollectionRecordData();
                  const basenameOfCurrentRouter = useRouterBasename();
                  const { t } = useTranslation();

                  if (recordData.type === NocoBaseDesktopRouteType.group) {
                    return <Tag>{t('None')} </Tag>;
                  }

                  if (recordData.type === NocoBaseDesktopRouteType.link) {
                    return <Tag>{t('None')} </Tag>;
                  }

                  if (recordData.type === NocoBaseDesktopRouteType.page) {
                    const path = `${basenameOfCurrentRouter === '/' ? '' : basenameOfCurrentRouter}${basename}/${
                      recordData.schemaUid
                    }`;
                    // 在点击 Access 按钮时，会用到
                    recordData._path = path;

                    return (
                      <Typography.Paragraph copyable style={{ marginBottom: 0 }}>
                        {path}
                      </Typography.Paragraph>
                    );
                  }

                  if (recordData.type === NocoBaseDesktopRouteType.tabs && data?.data) {
                    const path = `${
                      basenameOfCurrentRouter === '/' ? '' : basenameOfCurrentRouter
                    }${basename}/${getSchemaUidByRouteId(recordData.parentId, data.data)}/tabs/${recordData.schemaUid}`;
                    recordData._path = path;

                    return <Typography.Paragraph copyable> {path} </Typography.Paragraph>;
                  }

                  return <Tag>{t('Unknown')} </Tag>;
                },
                'x-read-pretty': true,
              },
            },
          },
          actions: {
            type: 'void',
            title: '{{t("Actions")}}',
            'x-component': 'TableV2.Column',
            properties: {
              addChild: {
                type: 'void',
                title: '{{t("Add child")}}',
                'x-component': 'Action.Link',
                'x-use-component-props': () => {
                  const recordData = useCollectionRecordData();
                  return {
                    disabled:
                      recordData.type !== NocoBaseDesktopRouteType.group &&
                      recordData.type !== NocoBaseDesktopRouteType.page,
                    openMode: 'drawer',
                  };
                },
                'x-decorator': 'Space',
                properties: {
                  drawer: {
                    type: 'void',
                    'x-component': 'Action.Drawer',
                    'x-decorator': 'Form',
                    'x-decorator-props': {
                      useValues(options) {
                        return {};
                      },
                    },
                    title: '{{t("Add child")}}',
                    properties: {
                      formSchema: {
                        type: 'void',
                        properties: {
                          type: {
                            type: 'string',
                            title: '{{t("Type")}}',
                            'x-decorator': 'FormItem',
                            'x-component': (props) => {
                              const { t } = useTranslation();
                              const recordData = useCollectionRecordData();
                              const isPage = recordData.type === NocoBaseDesktopRouteType.page;
                              const isGroup = recordData.type === NocoBaseDesktopRouteType.group;
                              const defaultValue = useMemo(() => {
                                if (isPage) {
                                  props.onChange(NocoBaseDesktopRouteType.tabs);
                                  return NocoBaseDesktopRouteType.tabs;
                                }
                                return NocoBaseDesktopRouteType.page;
                              }, [isPage, props]);

                              return (
                                <Radio.Group {...props} defaultValue={defaultValue}>
                                  <Radio value={NocoBaseDesktopRouteType.group} disabled={!isGroup}>
                                    {t('Group')}
                                  </Radio>
                                  <Radio value={NocoBaseDesktopRouteType.page} disabled={!isGroup}>
                                    {t('Page')}
                                  </Radio>
                                  <Radio value={NocoBaseDesktopRouteType.link} disabled={!isGroup}>
                                    {t('Link')}
                                  </Radio>
                                  <Radio value={NocoBaseDesktopRouteType.tabs} disabled={!isPage}>
                                    {t('Tab')}
                                  </Radio>
                                </Radio.Group>
                              );
                            },
                            required: true,
                            default: NocoBaseDesktopRouteType.page,
                          },
                          title: {
                            type: 'string',
                            title: '{{t("Title")}}',
                            'x-decorator': 'FormItem',
                            'x-component': 'Input',
                            required: true,
                          },
                          icon: {
                            type: 'string',
                            title: '{{t("Icon")}}',
                            'x-decorator': 'FormItem',
                            'x-component': 'IconPicker',
                          },
                          href: {
                            title: '{{t("URL")}}',
                            type: 'string',
                            'x-decorator': 'FormItem',
                            'x-component': VariableTextArea,
                            description: '{{t("Do not concatenate search params in the URL")}}',
                            'x-reactions': {
                              dependencies: ['type'],
                              fulfill: {
                                state: {
                                  hidden: '{{$deps[0] !== "link"}}',
                                },
                              },
                            },
                          },
                          params: {
                            type: 'array',
                            'x-component': 'ArrayItems',
                            'x-decorator': 'FormItem',
                            title: `{{t("Search parameters")}}`,
                            items: {
                              type: 'object',
                              properties: {
                                space: {
                                  type: 'void',
                                  'x-component': 'Space',
                                  'x-component-props': {
                                    style: {
                                      flexWrap: 'nowrap',
                                      maxWidth: '100%',
                                    },
                                    className: css`
                                      & > .ant-space-item:first-child,
                                      & > .ant-space-item:last-child {
                                        flex-shrink: 0;
                                      }
                                    `,
                                  },
                                  properties: {
                                    name: {
                                      type: 'string',
                                      'x-decorator': 'FormItem',
                                      'x-component': 'Input',
                                      'x-component-props': {
                                        placeholder: `{{t("Name")}}`,
                                      },
                                    },
                                    value: {
                                      type: 'string',
                                      'x-decorator': 'FormItem',
                                      'x-component': VariableTextArea,
                                      'x-component-props': {
                                        placeholder: `{{t("Value")}}`,
                                        useTypedConstant: true,
                                        changeOnSelect: true,
                                      },
                                    },
                                    remove: {
                                      type: 'void',
                                      'x-decorator': 'FormItem',
                                      'x-component': 'ArrayItems.Remove',
                                    },
                                  },
                                },
                              },
                            },
                            'x-reactions': {
                              dependencies: ['type'],
                              fulfill: {
                                state: {
                                  hidden: '{{$deps[0] !== "link"}}',
                                },
                              },
                            },
                            properties: {
                              add: {
                                type: 'void',
                                title: `{{t("Add parameter")}}`,
                                'x-component': 'ArrayItems.Addition',
                              },
                            },
                          },
                          hideInMenu: {
                            type: 'boolean',
                            title: '{{t("Show in menu")}}',
                            'x-decorator': 'FormItem',
                            'x-component': (props) => {
                              const [checked, setChecked] = useState(!props.value);
                              const onChange = () => {
                                setChecked(!checked);
                                props.onChange?.(checked);
                              };
                              return <Checkbox checked={checked} onChange={onChange} />;
                            },
                            default: false,
                          },
                        },
                      },
                      footer: {
                        type: 'void',
                        'x-component': 'Action.Drawer.Footer',
                        properties: {
                          cancel: {
                            title: '{{t("Cancel")}}',
                            'x-component': 'Action',
                            'x-component-props': {
                              useAction: '{{ cm.useCancelAction }}',
                            },
                          },
                          submit: {
                            title: '{{t("Submit")}}',
                            'x-component': 'Action',
                            'x-component-props': {
                              type: 'primary',
                              useAction: (actionCallback?: (values: any) => void) => {
                                const form = useForm();
                                const field = useField();
                                const ctx = useActionContext();
                                const { getDataBlockRequest } = useDataBlockRequestGetter();
                                const { createRoute } = useCreateRoute(collectionName);
                                const { createRouteSchema } = useCreateRouteSchema();
                                const recordData = useCollectionRecordData();
                                return {
                                  async run() {
                                    try {
                                      await form.submit();
                                      field.data = field.data || {};
                                      field.data.loading = true;
                                      const schemaUid = await createRouteSchema(form.values);
                                      let options;

                                      if (form.values.href || !_.isEmpty(form.values.params)) {
                                        options = {
                                          href: form.values.href,
                                          params: form.values.params,
                                        };
                                      }

                                      const res = await createRoute({
                                        parentId: recordData.id,
                                        ..._.omit(form.values, ['href', 'params']),
                                        schemaUid,
                                        options,
                                      });
                                      ctx.setVisible(false);
                                      actionCallback?.(res?.data?.data);
                                      await form.reset();
                                      field.data.loading = false;
                                      getDataBlockRequest()?.refresh();
                                    } catch (error) {
                                      if (field.data) {
                                        field.data.loading = false;
                                      }
                                      throw error;
                                    }
                                  },
                                };
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              edit: {
                type: 'void',
                title: '{{t("Edit")}}',
                'x-component': 'Action.Link',
                'x-component-props': {
                  openMode: 'drawer',
                },
                'x-use-component-props': 'useEditActionProps',
                'x-decorator': 'Space',
                properties: {
                  drawer: {
                    type: 'void',
                    'x-component': 'Action.Drawer',
                    'x-decorator': 'Form',
                    'x-decorator-props': {
                      useValues(options) {
                        const recordData = useCollectionRecordData();
                        const ctx = useActionContext();
                        return useRequest(
                          () =>
                            Promise.resolve({
                              data: {
                                ...recordData,
                                href: recordData.options?.href,
                                params: recordData.options?.params,
                              },
                            }),
                          { ...options, refreshDeps: [ctx.visible] },
                        );
                      },
                    },
                    title: '{{t("Edit")}}',
                    properties: {
                      formSchema: {
                        type: 'void',
                        properties: {
                          type: {
                            type: 'string',
                            title: '{{t("Type")}}',
                            'x-decorator': 'FormItem',
                            'x-component': (props) => {
                              const { t } = useTranslation();
                              return (
                                <Radio.Group {...props}>
                                  <Radio value={NocoBaseDesktopRouteType.group}>{t('Group')}</Radio>
                                  <Radio value={NocoBaseDesktopRouteType.page}>{t('Page')}</Radio>
                                  <Radio value={NocoBaseDesktopRouteType.link}>{t('Link')}</Radio>
                                  <Radio value={NocoBaseDesktopRouteType.tabs}>{t('Tab')}</Radio>
                                </Radio.Group>
                              );
                            },
                            default: NocoBaseDesktopRouteType.page,
                            required: true,
                            // 在编辑时，隐藏 type 字段，不允许用户编辑
                            'x-hidden': true,
                          },
                          title: {
                            type: 'string',
                            title: '{{t("Title")}}',
                            'x-decorator': 'FormItem',
                            'x-component': 'Input',
                            required: true,
                          },
                          icon: {
                            type: 'string',
                            title: '{{t("Icon")}}',
                            'x-decorator': 'FormItem',
                            'x-component': 'IconPicker',
                          },
                          href: {
                            title: '{{t("URL")}}',
                            type: 'string',
                            'x-decorator': 'FormItem',
                            'x-component': VariableTextArea,
                            description: '{{t("Do not concatenate search params in the URL")}}',
                            'x-reactions': {
                              dependencies: ['type'],
                              fulfill: {
                                state: {
                                  hidden: '{{$deps[0] !== "link"}}',
                                },
                              },
                            },
                          },
                          params: {
                            type: 'array',
                            'x-component': 'ArrayItems',
                            'x-decorator': 'FormItem',
                            title: `{{t("Search parameters")}}`,
                            items: {
                              type: 'object',
                              properties: {
                                space: {
                                  type: 'void',
                                  'x-component': 'Space',
                                  'x-component-props': {
                                    style: {
                                      flexWrap: 'nowrap',
                                      maxWidth: '100%',
                                    },
                                    className: css`
                                      & > .ant-space-item:first-child,
                                      & > .ant-space-item:last-child {
                                        flex-shrink: 0;
                                      }
                                    `,
                                  },
                                  properties: {
                                    name: {
                                      type: 'string',
                                      'x-decorator': 'FormItem',
                                      'x-component': 'Input',
                                      'x-component-props': {
                                        placeholder: `{{t("Name")}}`,
                                      },
                                    },
                                    value: {
                                      type: 'string',
                                      'x-decorator': 'FormItem',
                                      'x-component': VariableTextArea,
                                      'x-component-props': {
                                        placeholder: `{{t("Value")}}`,
                                        useTypedConstant: true,
                                        changeOnSelect: true,
                                      },
                                    },
                                    remove: {
                                      type: 'void',
                                      'x-decorator': 'FormItem',
                                      'x-component': 'ArrayItems.Remove',
                                    },
                                  },
                                },
                              },
                            },
                            'x-reactions': {
                              dependencies: ['type'],
                              fulfill: {
                                state: {
                                  hidden: '{{$deps[0] !== "link"}}',
                                },
                              },
                            },
                            properties: {
                              add: {
                                type: 'void',
                                title: `{{t("Add parameter")}}`,
                                'x-component': 'ArrayItems.Addition',
                              },
                            },
                          },
                          hideInMenu: {
                            type: 'boolean',
                            title: '{{t("Show in menu")}}',
                            'x-decorator': 'FormItem',
                            'x-component': (props) => {
                              const [checked, setChecked] = useState(!props.value);
                              const onChange = () => {
                                setChecked(!checked);
                                props.onChange?.(checked);
                              };
                              return <Checkbox checked={checked} onChange={onChange} />;
                            },
                            default: false,
                          },
                        },
                      },
                      footer: {
                        type: 'void',
                        'x-component': 'Action.Drawer.Footer',
                        properties: {
                          cancel: {
                            title: '{{t("Cancel")}}',
                            'x-component': 'Action',
                            'x-component-props': {
                              useAction: '{{ cm.useCancelAction }}',
                            },
                          },
                          submit: {
                            title: '{{t("Submit")}}',
                            'x-component': 'Action',
                            'x-component-props': {
                              type: 'primary',
                              useAction: (actionCallback?: (values: any) => void) => {
                                const form = useForm();
                                const field = useField();
                                const recordData = useCollectionRecordData();
                                const ctx = useActionContext();
                                const { getDataBlockRequest } = useDataBlockRequestGetter();
                                const { updateRoute } = useUpdateRoute(collectionName);

                                return {
                                  async run() {
                                    try {
                                      await form.submit();
                                      field.data = field.data || {};
                                      field.data.loading = true;
                                      let options;

                                      if (form.values.href || !_.isEmpty(form.values.params)) {
                                        options = {
                                          href: form.values.href,
                                          params: form.values.params,
                                        };
                                      }

                                      const res = await updateRoute({
                                        filterByTk: recordData.id,
                                        values: {
                                          ..._.omit(form.values, ['href', 'params']),
                                          options,
                                        },
                                      });
                                      ctx.setVisible(false);
                                      actionCallback?.(res?.data?.data);
                                      await form.reset();
                                      field.data.loading = false;
                                      getDataBlockRequest()?.refresh();
                                    } catch (error) {
                                      if (field.data) {
                                        field.data.loading = false;
                                      }
                                      throw error;
                                    }
                                  },
                                };
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              access: {
                type: 'void',
                title: '{{t("Access")}}',
                'x-component': 'Action.Link',
                'x-use-component-props': () => {
                  const recordData = useCollectionRecordData();
                  return {
                    onClick: () => {
                      window.open(recordData._path, '_blank');
                    },
                    disabled: !recordData._path,
                  };
                },
                'x-decorator': 'Space',
              },
              delete: {
                type: 'void',
                title: '{{t("Delete")}}',
                'x-decorator': 'Space',
                'x-component': 'Action.Link',
                'x-use-component-props': () => {
                  const recordData = useCollectionRecordData();
                  const api = useAPIClient();
                  const resource = useMemo(() => api.resource(collectionName), [api]);
                  const { getDataBlockRequest } = useDataBlockRequestGetter();

                  return {
                    onClick: () => {
                      resource
                        .destroy({
                          filterByTk: recordData.id,
                        })
                        .then(() => {
                          getDataBlockRequest().refresh();
                        })
                        .catch((error) => {
                          console.error(error);
                        });
                    },
                  };
                },
                'x-component-props': {
                  confirm: {
                    title: "{{t('Delete route')}}",
                    content: "{{t('Are you sure you want to delete it?')}}",
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};

function useCreateRoute(collectionName: string) {
  const api = useAPIClient();
  const resource = useMemo(() => api.resource(collectionName), [api, collectionName]);

  const createRoute = useCallback(
    (values: any) => {
      return resource.create({ values });
    },
    [resource],
  );

  return { createRoute };
}

function useUpdateRoute(collectionName: string) {
  const api = useAPIClient();
  const resource = useMemo(() => api.resource(collectionName), [api, collectionName]);

  const updateRoute = useCallback(
    ({ filterByTk, values }) => {
      return resource.update({ filterByTk, values });
    },
    [resource],
  );

  return { updateRoute };
}

function useCreateRouteSchema(collectionName = 'uiSchemas') {
  const api = useAPIClient();
  const resource = useMemo(() => api.resource(collectionName), [api, collectionName]);

  const createRouteSchema = useCallback(
    async ({
      title,
      icon,
      type,
      href,
      params,
    }: {
      title: string;
      icon: string;
      type: NocoBaseDesktopRouteType;
      href?: string;
      params?: Record<string, any>;
    }) => {
      const schemaUid = uid();
      const typeToSchema = {
        [NocoBaseDesktopRouteType.page]: {
          type: 'void',
          title,
          'x-component': 'Menu.Item',
          'x-decorator': 'ACLMenuItemProvider',
          'x-component-props': {
            icon,
          },
          properties: {
            page: {
              type: 'void',
              'x-component': 'Page',
              'x-async': true,
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid',
                  'x-initializer': 'page:addBlock',
                  properties: {},
                },
              },
            },
          },
          'x-uid': schemaUid,
        },
        [NocoBaseDesktopRouteType.group]: {
          type: 'void',
          title,
          'x-component': 'Menu.SubMenu',
          'x-decorator': 'ACLMenuItemProvider',
          'x-component-props': {
            icon,
          },
          'x-uid': schemaUid,
        },
        [NocoBaseDesktopRouteType.link]: {
          type: 'void',
          title,
          'x-component': 'Menu.URL',
          'x-decorator': 'ACLMenuItemProvider',
          'x-component-props': {
            icon,
            href,
            params,
          },
          'x-uid': schemaUid,
        },
      };

      await resource['insertAdjacent/nocobase-admin-menu']({
        position: 'beforeEnd',
        values: {
          schema: typeToSchema[type],
        },
      });

      return schemaUid;
    },
    [resource],
  );

  return { createRouteSchema };
}
