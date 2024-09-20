/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import {
  ActionProps,
  ISchema,
  useActionContext,
  useCollection,
  useCollectionRecord,
  useCollectionRecordData,
  useDataBlockRequest,
  useDataBlockResource,
} from '@nocobase/client';
import { uid } from '@formily/shared';
import { ExtendCollectionsProvider, SchemaComponent } from '@nocobase/client';
import { App as AntdApp } from 'antd';
import { createForm } from '@formily/core';
import { useForm } from '@formily/react';
import { usePluginSettingsTableRequest } from './PluginSettingsTableProvider';
import { useT, tStr } from './locale';
const printTemplateCollection = {
  name: 'printTemplate',
  filterTargetKey: 'id',
  fields: [
    {
      type: 'string',
      name: 'templateName',
      /**
       * @name 使用定义好的input的interface
       * @description input的定义https://github.com/nocobase/nocobase/blob/main/packages/core/client/src/collection-manager/interfaces/input.ts
       */
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: tStr('template name'),
        required: true,
        'x-component': 'Input',
      },
    },
    {
      type: 'text',
      name: 'templateRemark',
      interface: 'richText',
      uiSchema: {
        type: 'string',
        title: tStr('template remark'),
        required: true,
        'x-component': 'RichText',
      },
    },
    {
      type: 'string',
      name: 'templateType',
      interface: 'Radio',
      uiSchema: {
        type: 'string',
        title: tStr('template type'),
        enum: [
          { label: 'docx', value: 'docx' },
          { label: 'xlsx', value: 'xlsx' },
        ],
        required: true,
        'x-component': 'Radio.Group',
      },
    },
    {
      type: 'string',
      name: 'supportTable',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: tStr('support table'),
        // enum: [{ label: "User", value: "User" }, { label: "Order", value: "Order" }],
        required: true,
        'x-component': 'RemoteSelect',
        'x-component-props': {
          fieldNames: {
            label: 'name',
            value: 'id',
          },
          service: {
            resource: 'printTemplate',
            action: 'tableList',
          },
        },
      },
    },
    {
      type: 'string',
      name: 'templateFile',
      uiSchema: {
        type: 'string',
        title: tStr('template file'),
        'x-decorator': 'FormItem',
        'x-component': 'Upload.Attachment',
        'x-component-props': {
          action: 'printTemplate:uploadSelf', // 文件上传接口
          accept: '.docx,.xlsx', // 允许上传的文件类型
          maxCount: 1, // 允许上传的文件数量
          name: 'file', // 上传文件的字段名称
        },
      },
    },
  ],
};
// 新增或编辑保存
const useSubmitActionProps = () => {
  const t = useT();
  const { setVisible } = useActionContext();
  const { message } = AntdApp.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const { runAsync } = useDataBlockRequest();
  const collection = useCollection();
  const globalSettingsTableRequest = usePluginSettingsTableRequest();
  const mimeTypeToExtensionMap = {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  };
  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const v = form.values;

      // 编辑
      if (v[collection.filterTargetKey]) {
        // 判断是否传递了文件，如果传递了文件就按照匹配后缀逻辑走，否则就直接更新
        if (v.templateFile) {
          const m = mimeTypeToExtensionMap[v.templateFile.mimetype];
          if (m !== v.templateType) {
            message.warning(t('template type inconsistent'));
            return false;
          }
        }
        // 不管上面编辑的时候发生了什么后面都可以更新
        await resource.update({
          filterByTk: v[collection.filterTargetKey],
          values: v,
        });
      } else {
        // 新增操作
        if (v.templateFile) {
          const m = mimeTypeToExtensionMap[v.templateFile.mimetype];
          if (m !== v.templateType) {
            message.warning(t('template type inconsistent'));
            return false;
          } else {
            await resource.create({
              values: v,
            });
          }
        }
      }
      await runAsync();
      await globalSettingsTableRequest.runAsync();
      message.success(t('save success'));
      setVisible(false);
    },
  };
};
const useEditFormProps = () => {
  const recordData = useCollectionRecordData();
  const form = useMemo(
    () =>
      createForm({
        initialValues: recordData,
      }),
    [],
  );

  return {
    form,
  };
};
// 删除
function useDeleteActionProps(): ActionProps {
  const t = useT();
  const { message } = AntdApp.useApp();
  const record = useCollectionRecordData();
  const resource = useDataBlockResource();
  const { runAsync } = useDataBlockRequest();
  const globalSettingsTableRequest = usePluginSettingsTableRequest();
  const collection = useCollection();
  return {
    confirm: {
      title: t('confirm delete title'),
      content: t('confirm delete content'),
    },
    async onClick() {
      await resource.destroy({
        filterByTk: record[collection.filterTargetKey],
      });
      await runAsync();
      await globalSettingsTableRequest.runAsync();
      message.success(t('delete success'));
    },
  };
}

const schema: ISchema = {
  type: 'void',
  name: uid(),
  'x-component': 'CardItem',
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: printTemplateCollection.name,
    action: 'list',
    showIndex: true,
    dragSort: false,
  },
  properties: {
    actions: {
      type: 'void',
      'x-component': 'ActionBar',
      'x-component-props': {
        style: {
          marginBottom: 20,
        },
      },
      properties: {
        add: {
          type: 'void',
          'x-component': 'Action',
          title: tStr('add action'),
          'x-align': 'right',
          'x-component-props': {
            type: 'primary',
          },
          properties: {
            drawer: {
              type: 'void',
              'x-component': 'Action.Drawer',
              title: tStr('add action'),
              properties: {
                form: {
                  type: 'void',
                  'x-component': 'FormV2',
                  properties: {
                    templateName: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'CollectionField',
                      required: true,
                    },
                    templateRemark: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'CollectionField',
                      required: true,
                    },
                    templateType: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'CollectionField',
                      required: true,
                    },
                    supportTable: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'CollectionField',
                      required: true,
                    },
                    templateFile: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'CollectionField',
                      required: true,
                    },
                    footer: {
                      type: 'void',
                      'x-component': 'Action.Drawer.Footer',
                      properties: {
                        submit: {
                          title: 'Submit',
                          'x-component': 'Action',
                          'x-use-component-props': 'useSubmitActionProps',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // 列表信息
    table: {
      type: 'array',
      'x-component': 'TableV2',
      'x-use-component-props': 'useTableBlockProps',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
      },
      properties: {
        templateTame: {
          type: 'void',
          title: tStr('template name'),
          'x-component': 'TableV2.Column',
          properties: {
            templateName: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        templateRemark: {
          type: 'void',
          title: tStr('template remark'),
          'x-component': 'TableV2.Column',
          properties: {
            templateRemark: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        templateType: {
          type: 'void',
          title: tStr('template type'),
          'x-component': 'TableV2.Column',
          properties: {
            templateType: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        supportTable: {
          type: 'void',
          title: tStr('support table'),
          'x-component': 'TableV2.Column',
          properties: {
            supportTable: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        // 操作列
        actions: {
          type: 'void',
          title: tStr('actions'),
          'x-component': 'TableV2.Column',
          properties: {
            actions: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                split: '|',
              },
              properties: {
                // 编辑按钮
                edit: {
                  type: 'void',
                  title: tStr('edit action'),
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    openMode: 'drawer',
                    icon: 'EditOutlined',
                  },
                  properties: {
                    drawer: {
                      type: 'void',
                      title: tStr('edit action'),
                      'x-component': 'Action.Drawer',
                      properties: {
                        // 编辑表单
                        form: {
                          type: 'void',
                          'x-component': 'FormV2',
                          // 初始化值
                          'x-use-component-props': 'useEditFormProps',
                          properties: {
                            templateName: {
                              type: 'string',
                              'x-decorator': 'FormItem',
                              'x-component': 'CollectionField',
                              required: true,
                            },
                            templateRemark: {
                              type: 'string',
                              'x-decorator': 'FormItem',
                              'x-component': 'CollectionField',
                              required: true,
                            },
                            templateType: {
                              type: 'string',
                              'x-decorator': 'FormItem',
                              'x-component': 'CollectionField',
                              required: true,
                              'x-component-props': {
                                disabled: true,
                              },
                            },
                            supportTable: {
                              type: 'string',
                              'x-decorator': 'FormItem',
                              'x-component': 'CollectionField',
                              required: true,
                            },
                            templateFile: {
                              type: 'string',
                              'x-decorator': 'FormItem',
                              'x-component': 'CollectionField',
                              // required: true,
                            },
                            footer: {
                              type: 'void',
                              'x-component': 'Action.Drawer.Footer',
                              properties: {
                                submit: {
                                  title: 'Submit',
                                  'x-component': 'Action',
                                  'x-use-component-props': 'useSubmitActionProps',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                // 删除按钮
                delete: {
                  type: 'void',
                  title: tStr('delete action'),
                  'x-component': 'Action.Link',
                  'x-use-component-props': 'useDeleteActionProps',
                },
              },
            },
          },
        },
      },
    },
  },
};

export const PluginSettingsTable = () => {
  return (
    <ExtendCollectionsProvider collections={[printTemplateCollection]}>
      <SchemaComponent schema={schema} scope={{ useSubmitActionProps, useEditFormProps, useDeleteActionProps }} />
    </ExtendCollectionsProvider>
  );
};
