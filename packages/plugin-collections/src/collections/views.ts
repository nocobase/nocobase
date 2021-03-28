import { TableOptions } from '@nocobase/database';

export default {
  name: 'views',
  title: '视图配置',
  internal: true,
  sortable: true,
  model: 'ViewModel',
  developerMode: true,
  fields: [
    {
      interface: 'sort',
      type: 'sort',
      name: 'sort',
      scope: ['collection'],
      title: '排序',
      component: {
        type: 'sort',
        className: 'drag-visible',
        width: 60,
        showInTable: true,
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '视图名称',
      required: true,
      component: {
        type: 'string',
        className: 'drag-visible',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'name',
      title: '标识',
      component: {
        type: 'string',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'radio',
      type: 'string',
      name: 'type',
      title: '视图类型',
      required: true,
      dataSource: [
        { label: '表格', value: 'table' },
        { label: '日历', value: 'calendar' },
        // { label: '表单', value: 'form' },
        { label: '看板', value: 'kanban', disabled: true },
        { label: '地图', value: 'map', disabled: true },
      ],
      component: {
        type: 'radio',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
        default: 'table',
        "x-linkages": [
          {
            "type": "value:visible",
            "target": "filter",
            "condition": "{{ $self.value !== 'form' }}"
          },
          {
            type: "value:schema",
            target: "labelField",
            "condition": "{{ $self.value === 'calendar' }}",
            schema: {
              "x-component-props": {
                associatedKey: "{{ $form.values && $form.values.associatedKey }}"
              },
            },
          },
          {
            type: "value:schema",
            target: "startDateField",
            "condition": "{{ $self.value === 'calendar' }}",
            schema: {
              "x-component-props": {
                associatedKey: "{{ $form.values && $form.values.associatedKey }}"
              },
            },
          },
          {
            type: "value:schema",
            target: "endDateField",
            "condition": "{{ $self.value === 'calendar' }}",
            schema: {
              "x-component-props": {
                associatedKey: "{{ $form.values && $form.values.associatedKey }}"
              },
            },
          },
          {
            "type": "value:visible",
            "target": "labelField",
            "condition": "{{ $self.value === 'calendar' }}",
          },
          {
            "type": "value:visible",
            "target": "startDateField",
            "condition": "{{ $self.value === 'calendar' }}",
          },
          {
            "type": "value:visible",
            "target": "endDateField",
            "condition": "{{ $self.value === 'calendar' }}",
          },
        ],
      },
    },
    {
      interface: 'select',
      type: 'virtual',
      title: '标题字段',
      name: 'labelField',
      required: true,
      component: {
        type: 'remoteSelect',
        showInDetail: true,
        showInForm: true,
        'x-component-props': {
          mode: 'simple',
          resourceName: 'collections.fields',
          labelField: 'title',
          valueField: 'name',
          filter: {
            type: 'string',
          },
        },
      },
    },
    {
      interface: 'select',
      type: 'virtual',
      title: '开始日期字段',
      name: 'startDateField',
      // required: true,
      component: {
        type: 'remoteSelect',
        showInDetail: true,
        showInForm: true,
        'x-component-props': {
          placeholder: '默认为创建时间字段',
          mode: 'simple',
          resourceName: 'collections.fields',
          labelField: 'title',
          valueField: 'name',
          filter: {
            type: 'date',
          },
        },
      },
    },
    {
      interface: 'select',
      type: 'virtual',
      title: '结束日期字段',
      name: 'endDateField',
      // required: true,
      component: {
        type: 'remoteSelect',
        showInDetail: true,
        showInForm: true,
        'x-component-props': {
          placeholder: '默认为创建时间字段',
          mode: 'simple',
          resourceName: 'collections.fields',
          labelField: 'title',
          valueField: 'name',
          filter: {
            type: 'date',
          },
        },
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'filter',
      title: '筛选数据',
      developerMode: false,
      mode: 'replace',
      defaultValue: {},
      component: {
        type: 'filter',
        showInForm: true,
      },
    },
    {
      interface: 'radio',
      type: 'string',
      name: 'mode',
      title: '查看和编辑模式',
      required: true,
      dataSource: [
        { label: '常规模式', value: 'default' },
        { label: '快捷模式', value: 'simple' },
      ],
      component: {
        tooltip: "常规模式：点击数据进入查看界面，再次点击进入编辑界面<br/>快捷模式：点击数据直接打开编辑界面",
        type: 'radio',
        default: 'default',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'template',
      title: '模板',
      required: true,
      developerMode: true,
      dataSource: [
        { label: '表单', value: 'DrawerForm' },
        { label: '常规表格', value: 'Table' },
        { label: '简易表格', value: 'SimpleTable' },
        { label: '日历模板', value: 'Calendar' },
      ],
      component: {
        type: 'select',
        default: 'Table',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'radio',
      type: 'virtual',
      name: 'defaultPerPage',
      title: '默认每页显示几行数据',
      defaultValue: 50,
      dataSource: [
        { label: '10', value: 10 },
        { label: '20', value: 20 },
        { label: '50', value: 50 },
        { label: '100', value: 100 },
      ],
      component: {
        type: 'radio',
        showInForm: true,
        showInDetail: true,
      },
    },
    {
      interface: 'boolean',
      type: 'virtual',
      name: 'draggable',
      title: '支持拖拽数据排序',
      showInForm: true,
      showInDetail: true,
      component: {
        type: 'checkbox',
        showInForm: true,
        showInDetail: true,
      },
    },
    {
      interface: 'boolean',
      type: 'radio',
      name: 'default',
      title: '作为默认视图',
      defaultValue: false,
      scope: ['collection'],
      component: {
        type: 'checkbox',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'showInDataMenu',
      title: '作为数据表子菜单',
      defaultValue: false,
      component: {
        type: 'checkbox',
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
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
    // 以下暂不考虑
    // {
    //   type: 'belongsToMany',
    //   name: 'fields',
    //   component: {
    //     type: 'drawerSelect',
    //   },
    // },
    // {
    //   type: 'belongsToMany',
    //   name: 'actions',
    //   component: {
    //     type: 'drawerSelect',
    //   },
    // },
  ],
  actions: [
    {
      type: 'list',
      name: 'list',
      title: '查看',
    },
    {
      type: 'destroy',
      name: 'destroy',
      title: '删除',
      filter: {
        default: false
      }
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
  ],
  views: [
    {
      type: 'form',
      name: 'form',
      title: '表单',
      template: 'DrawerForm',
      developerMode: true,
    },
    {
      type: 'details',
      name: 'details',
      title: '详情',
      template: 'Details',
      actionNames: ['update'],
      developerMode: true,
    },
    {
      type: 'table',
      name: 'simple',
      title: '简易模式',
      template: 'SimpleTable',
      mode: 'simple',
      default: true,
      actionNames: ['destroy', 'create'],
      detailsViewName: 'details',
      updateViewName: 'form',
      paginated: false,
      draggable: true,
    },
  ],
} as TableOptions;
