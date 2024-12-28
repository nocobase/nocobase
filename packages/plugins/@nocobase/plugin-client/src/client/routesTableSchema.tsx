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
  getGroupMenuSchema,
  getLinkMenuSchema,
  getPageMenuSchema,
  getTabSchema,
  getVariableComponentWithScope,
  NocoBaseDesktopRouteType,
  useActionContext,
  useAllAccessDesktopRoutes,
  useAPIClient,
  useBlockRequestContext,
  useCollectionRecordData,
  useDataBlockRequestData,
  useDataBlockRequestGetter,
  useNocoBaseRoutes,
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
              const { deleteRouteSchema } = useDeleteRouteSchema();
              const data = useDataBlockRequestData();
              const { refresh: refreshMenu } = useAllAccessDesktopRoutes();

              return {
                async onClick() {
                  const filterByTk = tableBlockContextBasicValue.field?.data?.selectedRowKeys;
                  if (!filterByTk?.length) {
                    return;
                  }

                  for (const id of filterByTk) {
                    const schemaUid = getSchemaUidByRouteId(id, data?.data);
                    await deleteRouteSchema(schemaUid);
                  }

                  await resource.destroy({
                    filterByTk,
                  });
                  tableBlockContextBasicValue.field.data.clearSelectedRowKeys?.();
                  service?.refresh?.();
                  collectionName === 'desktopRoutes' && refreshMenu();
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
            title: '{{t("Hide in menu")}}',
            'x-component': 'Action',
            'x-use-component-props': () => {
              const tableBlockContextBasicValue = useTableBlockContextBasicValue();
              const { service } = useBlockRequestContext();
              const { refresh: refreshMenu } = useAllAccessDesktopRoutes();
              const { updateRoute } = useNocoBaseRoutes(collectionName);
              return {
                async onClick() {
                  const filterByTk = tableBlockContextBasicValue.field?.data?.selectedRowKeys;
                  if (!filterByTk?.length) {
                    return;
                  }
                  await updateRoute(filterByTk, {
                    hideInMenu: true,
                  });
                  tableBlockContextBasicValue.field.data.clearSelectedRowKeys?.();
                  service?.refresh?.();
                  refreshMenu();
                },
              };
            },
            'x-component-props': {
              icon: 'EyeInvisibleOutlined',
              confirm: {
                title: "{{t('Hide in menu')}}",
                content: "{{t('Are you sure you want to hide these routes in menu?')}}",
              },
            },
          },
          show: {
            type: 'void',
            title: '{{t("Show in menu")}}',
            'x-component': 'Action',
            'x-use-component-props': () => {
              const tableBlockContextBasicValue = useTableBlockContextBasicValue();
              const { service } = useBlockRequestContext();
              const { updateRoute } = useNocoBaseRoutes(collectionName);
              return {
                async onClick() {
                  const filterByTk = tableBlockContextBasicValue.field?.data?.selectedRowKeys;
                  if (!filterByTk?.length) {
                    return;
                  }
                  await updateRoute(filterByTk, {
                    hideInMenu: false,
                  });
                  tableBlockContextBasicValue.field.data.clearSelectedRowKeys?.();
                  service?.refresh?.();
                },
              };
            },
            'x-component-props': {
              icon: 'EyeOutlined',
              confirm: {
                title: "{{t('Show in menu')}}",
                content: "{{t('Are you sure you want to show these routes in menu?')}}",
              },
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
                            const { createRoute } = useNocoBaseRoutes(collectionName);
                            const { createRouteSchema } = useCreateRouteSchema();

                            return {
                              async run() {
                                try {
                                  await form.submit();
                                  field.data = field.data || {};
                                  field.data.loading = true;
                                  const { pageSchemaUid, tabSchemaUid, menuSchemaUid } = await createRouteSchema(
                                    form.values,
                                  );
                                  let options;

                                  if (form.values.href || !_.isEmpty(form.values.params)) {
                                    options = {
                                      href: form.values.href,
                                      params: form.values.params,
                                    };
                                  }

                                  const res = await createRoute({
                                    ..._.omit(form.values, ['href', 'params']),
                                    schemaUid: menuSchemaUid,
                                    pageSchemaUid:
                                      NocoBaseDesktopRouteType.page === form.values.type ? pageSchemaUid : undefined,
                                    options,
                                  });

                                  if (tabSchemaUid) {
                                    await createRoute({
                                      schemaUid: tabSchemaUid,
                                      parentId: res?.data?.data?.id,
                                      type: NocoBaseDesktopRouteType.tabs,
                                      title: '{{t("Tab")}}',
                                    });
                                  }

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
                  return <TypeTag value={props.value} />;
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
                    return null;
                  }

                  if (recordData.type === NocoBaseDesktopRouteType.link) {
                    return null;
                  }

                  if (recordData.type === NocoBaseDesktopRouteType.page) {
                    const path = `${basenameOfCurrentRouter.slice(0, -1)}${basename}/${recordData.schemaUid}`;
                    // 在点击 Access 按钮时，会用到
                    recordData._path = path;

                    return (
                      <Typography.Paragraph copyable style={{ marginBottom: 0 }}>
                        {path}
                      </Typography.Paragraph>
                    );
                  }

                  if (recordData.type === NocoBaseDesktopRouteType.tabs && data?.data) {
                    const path = `${basenameOfCurrentRouter.slice(0, -1)}${basename}/${getSchemaUidByRouteId(
                      recordData.parentId,
                      data.data,
                    )}/tabs/${recordData.schemaUid}`;
                    recordData._path = path;

                    return (
                      <Typography.Paragraph copyable style={{ marginBottom: 0 }}>
                        {path}
                      </Typography.Paragraph>
                    );
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
                              useAction: () => {
                                const form = useForm();
                                const field = useField();
                                const ctx = useActionContext();
                                const { getDataBlockRequest } = useDataBlockRequestGetter();
                                const { createRoute } = useNocoBaseRoutes(collectionName);
                                const { createRouteSchema, createTabRouteSchema } = useCreateRouteSchema();
                                const recordData = useCollectionRecordData();
                                return {
                                  async run() {
                                    try {
                                      await form.submit();
                                      field.data = field.data || {};
                                      field.data.loading = true;

                                      if (form.values.type === NocoBaseDesktopRouteType.tabs) {
                                        const { tabSchemaUid } = await createTabRouteSchema({
                                          ...form.values,
                                          parentSchemaUid: recordData.pageSchemaUid,
                                        });

                                        await createRoute({
                                          parentId: recordData.id,
                                          type: NocoBaseDesktopRouteType.tabs,
                                          schemaUid: tabSchemaUid,
                                          ...form.values,
                                        });
                                      } else {
                                        let options;
                                        const { pageSchemaUid, tabSchemaUid, menuSchemaUid } = await createRouteSchema(
                                          form.values,
                                        );

                                        if (form.values.href || !_.isEmpty(form.values.params)) {
                                          options = {
                                            href: form.values.href,
                                            params: form.values.params,
                                          };
                                        }

                                        const res = await createRoute({
                                          parentId: recordData.id,
                                          ..._.omit(form.values, ['href', 'params']),
                                          schemaUid: menuSchemaUid,
                                          pageSchemaUid:
                                            NocoBaseDesktopRouteType.page === form.values.type
                                              ? pageSchemaUid
                                              : undefined,
                                          options,
                                        });

                                        if (tabSchemaUid) {
                                          await createRoute({
                                            parentId: res?.data?.data?.id,
                                            type: NocoBaseDesktopRouteType.tabs,
                                            title: '{{t("Tab")}}',
                                            schemaUid: tabSchemaUid,
                                          });
                                        }
                                      }

                                      ctx.setVisible(false);
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
                              return <TypeTag value={props.value} />;
                            },
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
                                const recordData = useCollectionRecordData();
                                const ctx = useActionContext();
                                const { getDataBlockRequest } = useDataBlockRequestGetter();
                                const { updateRoute } = useNocoBaseRoutes(collectionName);

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

                                      const res = await updateRoute(recordData.id, {
                                        ..._.omit(form.values, ['href', 'params']),
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
                  const { deleteRouteSchema } = useDeleteRouteSchema();

                  return {
                    onClick: async () => {
                      await deleteRouteSchema(recordData.schemaUid);
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
      const menuSchemaUid = uid();
      const pageSchemaUid = uid();
      const tabSchemaUid = type === NocoBaseDesktopRouteType.page ? uid() : undefined;

      const typeToSchema = {
        [NocoBaseDesktopRouteType.page]: getPageMenuSchema({ title, icon, pageSchemaUid, tabSchemaUid, menuSchemaUid }),
        [NocoBaseDesktopRouteType.group]: getGroupMenuSchema({ title, icon, schemaUid: menuSchemaUid }),
        [NocoBaseDesktopRouteType.link]: getLinkMenuSchema({ title, icon, schemaUid: menuSchemaUid, href, params }),
      };

      await resource['insertAdjacent/nocobase-admin-menu']({
        position: 'beforeEnd',
        values: {
          schema: typeToSchema[type],
        },
      });

      return { menuSchemaUid, pageSchemaUid, tabSchemaUid };
    },
    [resource],
  );

  /**
   * 创建 Tab 的接口和其它的不太一样，所以单独实现一个方法
   */
  const createTabRouteSchema = useCallback(
    async ({ title, icon, parentSchemaUid }: { title: string; icon: string; parentSchemaUid: string }) => {
      const tabSchemaUid = uid();

      await resource[`insertAdjacent/${parentSchemaUid}`]({
        position: 'beforeEnd',
        values: {
          schema: getTabSchema({ title, icon, schemaUid: tabSchemaUid }),
        },
      });

      return { tabSchemaUid };
    },
    [resource],
  );

  return { createRouteSchema, createTabRouteSchema };
}

function useDeleteRouteSchema(collectionName = 'uiSchemas') {
  const api = useAPIClient();
  const resource = useMemo(() => api.resource(collectionName), [api, collectionName]);
  const { refresh: refreshMenu } = useAllAccessDesktopRoutes();

  const deleteRouteSchema = useCallback(
    async (schemaUid: string) => {
      const res = await resource[`remove/${schemaUid}`]();
      refreshMenu();
      return res;
    },
    [resource, refreshMenu],
  );

  return { deleteRouteSchema };
}

function TypeTag(props) {
  const { t } = useTranslation();
  const colorMap = {
    [NocoBaseDesktopRouteType.group]: 'blue',
    [NocoBaseDesktopRouteType.page]: 'green',
    [NocoBaseDesktopRouteType.link]: 'red',
    [NocoBaseDesktopRouteType.tabs]: 'orange',
  };
  const valueMap = {
    [NocoBaseDesktopRouteType.group]: t('Group'),
    [NocoBaseDesktopRouteType.page]: t('Page'),
    [NocoBaseDesktopRouteType.link]: t('Link'),
    [NocoBaseDesktopRouteType.tabs]: t('Tab'),
  };

  return <Tag color={colorMap[props.value]}>{valueMap[props.value]}</Tag>;
}
