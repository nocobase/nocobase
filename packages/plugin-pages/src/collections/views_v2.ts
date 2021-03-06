import { TableOptions } from '@nocobase/database';
import { getViewFields } from '../views';

const fields = getViewFields();

export default {
  name: 'views_v2',
  title: '视图配置',
  // internal: true,
  model: 'BaseModelV2',
  developerMode: false,
  createdAt: false,
  updatedAt: false,
  fields: [
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '视图名称',
      required: true,
    },
    {
      interface: 'string',
      type: 'randomString',
      name: 'name',
      title: '缩略名',
      required: true,
      createOnly: true,
      randomString: {
        length: 6,
        characters: 'abcdefghijklmnopqrstuvwxyz0123456789',
      },
      developerMode: true,
    },
    {
      interface: 'radio',
      type: 'boolean',
      name: 'dataSourceType',
      title: '数据来源',
      dataSource: [
        { label: '当前数据表', value: 'collection' },
        { label: '相关数据表', value: 'association' },
      ],
      linkages: [
        {
          "type": "value:visible",
          "target": "targetFieldName",
          "condition": "{{ $self.value === 'association' }}"
        },
        {
          "type": "value:visible",
          "target": "targetViewName",
          "condition": "{{ $self.value === 'association' }}"
        },
        {
          "type": "value:visible",
          "target": "type",
          "condition": "{{ $self.value === 'collection' }}"
        },
      ],
    },
    {
      interface: 'select',
      type: 'virtual',
      title: '相关数据',
      name: 'targetFieldName',
      required: true,
      component: {
        type: 'remoteSelect',
        resourceName: 'collections.fields',
        labelField: 'title',
        valueField: 'name',
      },
    },
    {
      interface: 'select',
      type: 'virtual',
      title: '相关数据表的视图',
      name: 'targetViewName',
      required: true,
      component: {
        type: 'remoteSelect',
        resourceName: 'collections.views',
        labelField: 'title',
        valueField: 'name',
      },
    },
    ...fields,
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      targetKey: 'name',
      title: '所属数据表',
      labelField: 'title',
      valueField: 'name',
      multiple: false,
      component: {
        type: 'remoteSelect',
        showInDetail: true,
        showInForm: true,
        'x-component-props': {
          resourceName: 'collections',
          labelField: 'title',
          valueField: 'name',
        },
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'options',
      title: '配置信息',
      defaultValue: {},
      developerMode: true,
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
      title: '新增',
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
      mode: 'simple',
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
  views_v2: [
    {
      type: 'table',
      name: 'table',
      title: '全部数据',
      labelField: 'title',
      actions: [
        {
          name: 'create',
          type: 'create',
          title: '新增',
          viewName: 'form',
        },
        {
          name: 'destroy',
          type: 'destroy',
          title: '删除',
        },
      ],
      fields: [
        'title',
        'type',
      ],
      detailsOpenMode: 'drawer', // window
      details: ['form'],
      sort: ['id'],
    },
    {
      type: 'form',
      name: 'form',
      title: '表单',
      fields: [
        'title',
        'dataSourceType',
        'targetFieldName',
        'targetViewName',
        ...fields.map(field => field.name),
      ],
    },
  ],
  pages_v2: [
    {
      title: '表格',
      name: 'all',
      views: ['table'],
    },
    {
      title: '表单',
      name: 'form',
      views: ['form'],
    },
  ],
} as TableOptions;
