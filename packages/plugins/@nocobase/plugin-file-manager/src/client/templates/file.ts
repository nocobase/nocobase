import { CollectionTemplate, getConfigurableProperties } from '@nocobase/client';
import { NAMESPACE } from '../locale';

export class FileCollectionTemplate extends CollectionTemplate {
  name = 'file';
  title = `{{t("File collection", { ns: "${NAMESPACE}" })}}`;
  order = 3;
  color = 'blue';
  default = {
    createdBy: true,
    updatedBy: true,
    fields: [
      {
        interface: 'input',
        type: 'string',
        name: 'title',
        deletable: false,
        uiSchema: {
          type: 'string',
          title: `{{t("Title")}}`,
          'x-component': 'Input',
        },
      },
      // '系统文件名（含扩展名）',
      {
        interface: 'input',
        type: 'string',
        name: 'filename',
        deletable: false,
        uiSchema: {
          type: 'string',
          title: `{{t("File name", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
      // '扩展名（含“.”）',
      {
        interface: 'input',
        type: 'string',
        name: 'extname',
        deletable: false,
        uiSchema: {
          type: 'string',
          title: `{{t("Extension name", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
      // '文件体积（字节）',
      {
        interface: 'integer',
        type: 'integer',
        name: 'size',
        deletable: false,
        uiSchema: {
          type: 'number',
          title: `{{t("Size", { ns: "${NAMESPACE}" })}}`,
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
        deletable: false,
        uiSchema: {
          type: 'string',
          title: `{{t("MIME type", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
      // '相对路径（含“/”前缀）',
      {
        interface: 'input',
        type: 'string',
        name: 'path',
        deletable: false,
        uiSchema: {
          type: 'string',
          title: `{{t("Path", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
      // 文件的可访问地址
      {
        interface: 'input',
        type: 'string',
        name: 'url',
        deletable: false,
        uiSchema: {
          type: 'string',
          title: `{{t("URL")}}`,
          'x-component': 'Input.URL',
          'x-read-pretty': true,
        },
      },
      // 用于预览
      {
        interface: 'url',
        type: 'string',
        name: 'preview',
        field: 'url', // 直接引用 url 字段
        deletable: false,
        uiSchema: {
          type: 'string',
          title: `{{t("Preview", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'Preview',
          'x-read-pretty': true,
        },
      },
      {
        comment: '存储引擎',
        type: 'belongsTo',
        name: 'storage',
        target: 'storages',
        foreignKey: 'storageId',
        deletable: false,
        uiSchema: {
          type: 'string',
          title: `{{t("Storage", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
      // '其他文件信息（如图片的宽高）',
      {
        type: 'jsonb',
        name: 'meta',
        deletable: false,
        defaultValue: {},
      },
    ],
  };
  configurableProperties = {
    ...getConfigurableProperties('title', 'name'),
    inherits: {
      ...getConfigurableProperties('inherits').inherits,
      'x-reactions': ['{{useAsyncDataSource(loadCollections)}}'],
    },
    ...getConfigurableProperties('category', 'description'),
    storage: {
      title: `{{t("File storage", { ns: "${NAMESPACE}" })}}`,
      type: 'hasOne',
      name: 'storage',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': ['{{useAsyncDataSource(loadStorages)}}'],
    },
    ...getConfigurableProperties('presetFields'),
  };
}
