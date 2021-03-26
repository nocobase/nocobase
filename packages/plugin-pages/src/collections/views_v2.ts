import { TableOptions } from '@nocobase/database';
import { getTypeFieldOptions, getViewFields } from '../views';

const fields = getViewFields();
const associatedKeyValue = "{{ $form.values && $form.values.collection && $form.values.collection.name }}";

export default {
  name: 'views_v2',
  title: '视图配置',
  internal: true,
  model: 'BaseModelV2',
  developerMode: true,
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
    getTypeFieldOptions(),
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
      type: 'string',
      name: 'dataSourceType',
      title: '数据来源',
      defaultValue: 'collection',
      dataSource: [
        { label: '所属数据表', value: 'collection' },
        { label: '所属数据表的相关数据', value: 'association' },
      ],
      linkages: [
        {
          "type": "value:visible",
          "target": "targetField",
          "condition": "{{ $self.value === 'association' }}"
        },
        // {
        //   "type": "value:visible",
        //   "target": "type",
        //   "condition": "{{ $self.value === 'collection' }}"
        // },
      ],
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      title: '相关数据',
      name: 'targetField',
      target: 'fields',
      required: true,
      multiple: false,
      component: {
        type: 'remoteSelect',
        'x-component-props': {
          resourceName: 'collections.fields',
          labelField: 'title',
          valueField: 'id',
          objectValue: true,
          filter: {
            interface: 'linkTo',
          },
          multiple: false,
        },
        'x-linkages': [
          {
            "type": "value:visible",
            "target": "targetView",
            "condition": "{{ !!$self.value }}"
          },
          {
            type: 'value:schema',
            target: 'targetView',
            "condition": "{{ !!$self.value }}",
            schema: {
              'x-component-props': {
                associatedKey: "{{ $self.value && $self.value.target }}"
              },
            },
          },
        ],
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      title: '相关数据表视图',
      name: 'targetView',
      target: 'views_v2',
      required: true,
      multiple: false,
      component: {
        type: 'remoteSelect',
        'x-component-props': {
          resourceName: 'collections.views_v2',
          labelField: 'title',
          valueField: 'id',
          multiple: false,
        },
      },
    },
    // {
    //   interface: 'select',
    //   type: 'virtual',
    //   title: '相关数据表的视图',
    //   name: 'targetViewName',
    //   required: true,
    //   component: {
    //     type: 'remoteSelect',
    //     resourceName: 'collections.views',
    //     labelField: 'title',
    //     valueField: 'name',
    //     'x-component-props': {
    //       resourceName: 'collections.views',
    //       labelField: 'title',
    //       valueField: 'name',
    //       multiple: false,
    //     },
    //   },
    // },
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
        type: 'drawerSelect',
        showInDetail: true,
        showInForm: true,
        'x-component-props': {
          resourceName: 'collections',
          labelField: 'title',
          valueField: 'name',
        },
        'x-linkages': [
          {
            type: 'value:schema',
            target: '*',
            schema: {
              'x-component-props': {
                associatedKey: associatedKeyValue,
              },
            },
          },
        ],
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
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'developerMode',
      title: '开发者模式',
      defaultValue: false,
      component: {
        type: 'boolean',
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
  views_v2: [
    {
      developerMode: true,
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
        'collection',
      ],
      detailsOpenMode: 'drawer', // window
      details: ['form'],
      sort: ['id'],
    },
    {
      developerMode: true,
      type: 'form',
      name: 'form',
      title: '表单',
      fields: [
        'title',
        'type',
        'collection',
        'dataSourceType',
        'targetField',
        'targetView',
        ...fields.map(field => field.name),
      ],
    },
  ],
} as TableOptions;
