import { getConfigurableProperties } from '@nocobase/client';
import { CollectionOptions } from '@nocobase/database';

export const file = {
  name: 'file',
  title: '{{t("File collection")}}',
  order: 3,
  color: 'blue',
  default: {
    createdBy: true,
    updatedBy: true,
    fields: [
      {
        interface: 'input',
        type: 'string',
        name: 'title',
        uiSchema: {
          type: 'string',
          title: '{{t("Title")}}',
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
      // '系统文件名（含扩展名）',
      {
        interface: 'input',
        type: 'string',
        name: 'filename',
        uiSchema: {
          type: 'string',
          title: '{{t("File name")}}',
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
      // '扩展名（含“.”）',
      {
        interface: 'input',
        type: 'string',
        name: 'extname',
        uiSchema: {
          type: 'string',
          title: '{{t("Extension name")}}',
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
      // '文件体积（字节）',
      {
        interface: 'integer',
        type: 'integer',
        name: 'size',
        uiSchema: {
          type: 'number',
          title: '{{t("Size")}}',
          'x-component': 'InputNumber',
          'x-read-pretty': true,
          'x-component-props': {
            stringMode: true,
            step: '0',
          },
        },
      },
      {
        interface: 'input',
        type: 'string',
        name: 'mimetype',
        uiSchema: {
          type: 'string',
          title: '{{t("Mime type")}}',
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
      // '相对路径（含“/”前缀）',
      {
        interface: 'input',
        type: 'string',
        name: 'path',
        uiSchema: {
          type: 'string',
          title: '{{t("Path")}}',
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
      // 文件的可访问地址
      {
        interface: 'input',
        type: 'string',
        name: 'url',
        uiSchema: {
          type: 'string',
          title: '{{t("URL")}}',
          'x-component': 'Input.URL',
          'x-read-pretty': true,
        },
      },
      // 用于预览
      {
        interface: 'preview',
        type: 'string',
        name: 'preview',
        field: 'url', // 直接引用 url 字段
        uiSchema: {
          type: 'string',
          title: '{{t("Preview")}}',
          'x-component': 'Preview.Selector',
          'x-read-pretty': true,
        },
      },
      // '其他文件信息（如图片的宽高）',
      {
        type: 'jsonb',
        name: 'meta',
        defaultValue: {},
      },
    ],
  },
  configurableProperties: {
    ...getConfigurableProperties('title', 'name', 'inherits', 'category'),
    fileStorage: {
      title: '{{t("File storage")}}',
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        defaultValue: 'local',
        options: [
          {
            label: '{{t("Local storage")}}',
            value: 'local',
          },
        ],
      },
    },
    ...getConfigurableProperties('moreOptions'),
  },
} as CollectionOptions;
