import { TableOptions } from '@nocobase/database';

export default {
  name: 'attachments',
  title: '文件管理器',
  internal: true,
  fields: [
    {
      comment: '唯一 ID，系统文件名',
      type: 'uuid',
      name: 'id',
      primaryKey: true
    },
    {
      comment: '用户文件名',
      type: 'string',
      name: 'name',
    },
    {
      comment: '扩展名（含“.”）',
      type: 'string',
      name: 'extname',
    },
    {
      comment: '文件体积（字节）',
      type: 'integer',
      name: 'size',
    },
    {
      comment: '文件类型（mimetype 前半段，通常用于预览）',
      type: 'string',
      name: 'type',
    },
    {
      type: 'string',
      name: 'mimetype',
    },
    {
      comment: '存储引擎',
      type: 'belongsTo',
      name: 'storage',
    },
    {
      comment: '相对路径',
      type: 'string',
      name: 'path',
    },
    {
      comment: '其他文件信息（如图片的宽高）',
      type: 'jsonb',
      name: 'meta',
    },
    {
      comment: '网络访问地址',
      type: 'url',
      name: 'url'
    }
  ],
  actions: [
    {
      type: 'list',
      name: 'list',
      title: '查看',
    },
    {
      type: 'create',
      name: 'create',
      title: '创建',
      viewName: 'form',
    },
    {
      type: 'update',
      name: 'update',
      title: '编辑',
      viewName: 'form',
    },
    {
      type: 'destroy',
      name: 'destroy',
      title: '删除',
    },
  ],
  views: [
    {
      type: 'form',
      name: 'form',
      title: '表单',
      template: 'DrawerForm',
    },
    {
      type: 'details',
      name: 'details',
      title: '详情',
      template: 'Details',
      actionNames: ['update'],
    },
    {
      type: 'simple',
      name: 'simple',
      title: '简易模式',
      template: 'SimpleTable',
      actionNames: ['create', 'destroy'],
      detailsViewName: 'details',
      updateViewName: 'form',
      default: true,
    },
    {
      type: 'table',
      name: 'table',
      title: '列表',
      template: 'Table',
      actionNames: ['create', 'destroy'],
    },
  ],
} as TableOptions;
