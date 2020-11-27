import { TableOptions } from '@nocobase/database';
import FieldModel from '../models/field';
import { options } from '../interfaces';

export default {
  name: 'fields',
  title: '字段配置',
  sortable: true,
  model: FieldModel,
  fields: [
    {
      interface: 'sort',
      type: 'integer',
      name: 'sort',
      title: '排序',
      defaultValue: 1,
      component: {
        type: 'sort',
        className: 'drag-visible',
        width: 60,
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '字段名称',
      component: {
        type: 'string',
        className: 'drag-visible',
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'name',
      title: '标识',
      required: true,
      component: {
        type: 'string',
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'interface',
      title: '字段类型',
      component: {
        type: 'select',
        options,
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'type',
      title: '数据类型',
      component: {
        type: 'string',
      },
    },
    // 分组的先不考虑
    // {
    //   interface: 'linkTo',
    //   type: 'belongsTo',
    //   name: 'parent',
    //   target: 'fields',
    //   foreignKey: 'parent_id',
    //   title: '所属分组',
    //   component: {
    //     type: 'drawerSelect',
    //   },
    // },
    // {
    //   type: 'hasMany',
    //   name: 'children',
    //   target: 'fields',
    //   foreignKey: 'parent_id',
    //   sourceKey: 'id',
    // },
    // {
    //   type: 'integer',
    //   name: 'parent_id',
    //   component: {
    //     type: 'number',
    //   },
    // },
    {
      interface: 'string',
      type: 'virtual',
      name: 'component.tooltip',
      title: '提示信息',
      component: {
        type: 'string',
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'required',
      title: '必填项',
      component: {
        type: 'checkbox',
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'showInTable',
      title: '显示在表格中',
      component: {
        type: 'checkbox',
        tooltip: '若勾选，该字段将作为一列显示在数据表里',
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'showInForm',
      title: '显示在表单中',
      component: {
        type: 'checkbox',
        tooltip: '若勾选，该字段将出现在表单中',
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'showInDetail',
      title: '显示在详情中',
      component: {
        type: 'checkbox',
        tooltip: '若勾选，该字段将出现在详情中',
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      title: '所属数据表',
      target: 'collections',
      targetKey: 'name',
      component: {
        type: 'drawerSelect',
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'options',
      title: '配置信息',
      defaultValue: {},
      component: {
        type: 'hidden',
      },
    },
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
      type: 'table',
      name: 'simple',
      title: '简易模式',
      template: 'SimpleTable',
      default: true,
      actionNames: ['create', 'destroy'],
      detailsViewName: 'details',
      updateViewName: 'form',
      paginated: false,
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
