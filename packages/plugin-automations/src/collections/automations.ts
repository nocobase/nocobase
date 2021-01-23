import { TableOptions } from '@nocobase/database';

export default {
  name: 'automations',
  title: '自动化',
  fields: [
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '自动化名称',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'enabled',
      title: '启用',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'textarea',
      type: 'text',
      name: 'description',
      title: '描述',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'select',
      type: 'string',
      title: '触发方式',
      dataSource: [
        {
          label: '数据表事件',
          children: [
            {
              value: 'collections:afterCreate',
              label: '新增数据时',
            },
            {
              value: 'collections:afterUpdate',
              label: '更新数据时',
            },
            {
              value: 'collections:afterCreateOrUpdate',
              label: '新增或更新数据时',
            },
          ],
        },
        {
          label: '定时任务',
          children: [
            {
              value: 'schedule',
              label: '自定义时间触发',
            },
            {
              value: 'collections:schedule',
              label: '根据日期字段触发',
            },
          ],
        },
      ],
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      title: '触发数据表',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'multipleSelect',
      type: 'json',
      name: 'fields',
      title: '发生变动的字段',
      component: {
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'startDateField',
      title: '开始日期字段',
      component: {
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'datetime',
      type: 'date',
      name: 'startTime',
      title: '开始时间',
      showTime: true,
      component: {
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'cron',
      title: '重复周期',
      dataSource: [
        {
          label: '不重复',
          value: 'norepeat',
        },
        {
          label: '每天',
          value: 'everyday',
        },
        {
          label: '每周',
          value: 'everyweek',
        },
        {
          label: '每月',
          value: 'everymonth',
        },
        {
          label: '每季度',
          value: 'everyquarter',
        },
        {
          label: '每年',
          value: 'everyYear',
        },
        {
          label: '自定义',
          value: 'other',
        },
      ],
      component: {
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'endMode',
      title: '结束方式',
      dataSource: [
        { label: '永不结束', value: '' },
        { label: '指定重复次数', value: '' },
        { label: '根据日期字段', value: '' },
        { label: '自定义结束时间', value: '' },
      ],
      component: {
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'endDateField',
      title: '结束日期字段',
      component: {
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'datetime',
      type: 'date',
      name: 'endTime',
      title: '结束时间',
      showTime: true,
      component: {
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'filter',
      title: '数据符合以下条件才会触发',
      component: {
        type: 'filter',
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'jobs',
      target: 'automations_jobs',
      title: '任务',
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
      name: 'table',
      title: '全部数据',
      template: 'Table',
      actionNames: ['destroy', 'create'],
      default: true,
      draggable: true,
    },
  ],
  tabs: [
    {
      type: 'details',
      name: 'details',
      title: '详情',
      viewName: 'details',
    },
    {
      type: 'association',
      name: 'jobs',
      title: '任务',
      association: 'jobs',
      viewName: 'table',
      default: true,
    },
  ],
} as TableOptions;
