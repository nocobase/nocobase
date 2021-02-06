import { TableOptions } from '@nocobase/database';

export default {
  name: 'automations',
  model: 'AutomationModel',
  title: '自动化',
  internal: true,
  developerMode: true,
  fields: [
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '自动化名称',
      required: true,
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
      name: 'type',
      required: true,
      createOnly: true,
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
        "x-linkages": [
          {
            "type": "value:visible",
            "target": "changed",
            "condition": "{{ ['collections:afterUpdate', 'collections:afterCreateOrUpdate'].indexOf($self.value) !== -1 }}"
          },
          {
            "type": "value:visible",
            "target": "startTime",
            "condition": "{{ ['schedule', 'collections:schedule'].indexOf($self.value) !== -1 }}"
          },
          // {
          //   "type": "value:visible",
          //   "target": "endDateField",
          //   "condition": "{{ ['collections:schedule'].indexOf($self.value) !== -1 }}"
          // },
          // {
          //   "type": "value:visible",
          //   "target": "startTime",
          //   "condition": "{{ ['schedule'].indexOf($self.value) !== -1 }}"
          // },
          // {
          //   "type": "value:visible",
          //   "target": "endTime",
          //   "condition": "{{ ['schedule'].indexOf($self.value) !== -1 }}"
          // },
          {
            "type": "value:visible",
            "target": "cron",
            "condition": "{{ ['collections:schedule', 'schedule'].indexOf($self.value) !== -1 }}"
          },
          // {
          //   "type": "value:visible",
          //   "target": "endMode",
          //   "condition": "{{ ['collections:schedule', 'schedule'].indexOf($self.value) !== -1 }}"
          // },
          {
            "type": "value:visible",
            "target": "collection",
            "condition": "{{ $self.value && $self.value !== 'schedule' }}"
          },
          {
            "type": "value:visible",
            "target": "filter",
            "condition": "{{ $self.value && $self.value !== 'schedule' }}"
          },
          {
            "type": "value:schema",
            "target": "startTime",
            "condition": "{{ $self.value === 'collections:schedule' }}",
            schema: {
              title: '开始日期字段',
              'x-component-props': {
                automationType: '{{ $self.value }}'
              },
            },
          },
          {
            "type": "value:schema",
            "target": "endMode",
            "condition": "{{ ['collections:schedule', 'schedule'].indexOf($self.value) !== -1 }}",
            schema: {
              'x-component-props': {
                automationType: '{{ $self.value }}'
              },
            },
          },
          {
            "type": "value:schema",
            "target": "endTime",
            "condition": "{{ $self.value === 'collections:schedule' }}",
            schema: {
              title: '结束日期字段',
              'x-component-props': {
                automationType: '{{ $self.value }}'
              },
            },
          },
          {
            "type": "value:schema",
            "target": "startTime",
            "condition": "{{ $self.value === 'schedule' }}",
            schema: {
              title: '开始时间',
              'x-component-props': {
                automationType: '{{ $self.value }}'
              },
            },
          },
          {
            "type": "value:schema",
            "target": "endTime",
            "condition": "{{ $self.value === 'schedule' }}",
            schema: {
              title: '结束时间',
              'x-component-props': {
                automationType: '{{ $self.value }}'
              },
            },
          },

          // {
          //   "type": "value:state",
          //   "target": "cron",
          //   "condition": "{{ ['collections:schedule', 'schedule'].indexOf($self.value) !== -1 }}",
          //   state: {
          //     value: 'none',
          //   },
          // },
          // {
          //   "type": "value:state",
          //   "target": "endMode",
          //   "condition": "{{ ['collections:schedule', 'schedule'].indexOf($self.value) !== -1 }}",
          //   state: {
          //     value: 'none',
          //   },
          // }
        ],
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      targetKey: 'name',
      title: '触发数据表',
      labelField: 'title',
      valueField: 'name',
      required: true,
      multiple: false,
      createOnly: true,
      component: {
        type: 'remoteSelect',
        showInDetail: true,
        showInForm: true,
        'x-component-props': {
          mode: 'multiple',
          resourceName: 'collections',
          labelField: 'title',
          valueField: 'name',
        },
        "x-linkages": [
          {
            "type": "value:visible",
            "target": "changed",
            "condition": "{{ $self.value && ['collections:afterUpdate', 'collections:afterCreateOrUpdate'].indexOf($form.values.type) !== -1 }}"
          },
          // {
          //   "type": "value:visible",
          //   "target": "startTime",
          //   "condition": "{{ $self.value && ['collections:schedule'].indexOf($form.values.type) !== -1 }}"
          // },
          {
            type: "value:schema",
            target: "changed",
            // condition: "{{ $self.value }}",
            schema: {
              "x-component-props": {
                "associatedKey": "{{ typeof $self.value === 'string' ? $self.value : $form.values.collection_name }}"
              },
            },
          },
          {
            type: "value:schema",
            target: "startTime",
            // condition: "{{ $self.value }}",
            schema: {
              "x-component-props": {
                "associatedKey": "{{ typeof $self.value === 'string' ? $self.value : $form.values.collection_name }}"
              },
            },
          },
          {
            type: "value:schema",
            target: "endTime",
            // condition: "{{ $self.value }}",
            schema: {
              "x-component-props": {
                "associatedKey": "{{ typeof $self.value === 'string' ? $self.value : $form.values.collection_name }}"
              },
            },
          },
          {
            type: "value:schema",
            target: "filter",
            // condition: "{{ $self.value }}",
            schema: {
              "x-component-props": {
                "associatedKey": "{{ typeof $self.value === 'string' ? $self.value : $form.values.collection_name }}"
              },
            },
          },
        ],
      },
    },
    {
      interface: 'multipleSelect',
      type: 'json',
      name: 'changed',
      title: '发生变动的字段',
      labelField: 'title',
      valueField: 'name',
      component: {
        type: 'remoteSelect',
        showInDetail: true,
        showInForm: true,
        'x-component-props': {
          mode: 'simple',
          multiple: true,
          resourceName: 'collections.fields',
          labelField: 'title',
          valueField: 'name',
        },
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'startTime',
      title: '开始时间',
      showTime: true,
      required: true,
      component: {
        type: 'automations.datetime',
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'select',
      type: 'json',
      name: 'cron',
      title: '重复周期',
      required: true,
      // dataSource: [
      //   {
      //     label: '不重复',
      //     value: 'norepeat',
      //   },
      //   {
      //     label: '每天',
      //     value: 'everyday',
      //   },
      //   {
      //     label: '每周',
      //     value: 'everyweek',
      //   },
      //   {
      //     label: '每月',
      //     value: 'everymonth',
      //   },
      //   {
      //     label: '每季度',
      //     value: 'everyquarter',
      //   },
      //   {
      //     label: '每年',
      //     value: 'everyYear',
      //   },
      //   {
      //     label: '自定义',
      //     value: 'other',
      //   },
      // ],
      component: {
        type: 'automations.cron',
        showInDetail: true,
        showInForm: true,
        // default: 'none',
        "x-linkages": [
          {
            "type": "value:visible",
            "target": "endMode",
            "condition": "{{ $self.value && $self.value !== 'none' }}"
          },
          // {
          //   type: "value:schema",
          //   target: "endMode",
          //   condition: "{{ $form.values.type === 'schedule' && $self.value && $self.value !== 'norepeat' }}",
          //   schema: {
          //     enum: [
          //       { label: '永不结束', value: 'never' },
          //       { label: '指定重复次数', value: 'repeatTime' },
          //       { label: '自定义结束时间', value: 'customTime' },
          //     ]
          //   },
          // },
          // {
          //   type: "value:schema",
          //   target: "endMode",
          //   condition: "{{ $form.values.type === 'collections:schedule' && $self.value && $self.value !== 'norepeat' }}",
          //   schema: {
          //     enum: [
          //       { label: '永不结束', value: 'never' },
          //       { label: '指定重复次数', value: 'repeatTime' },
          //       { label: '根据日期字段', value: 'customField' },
          //     ]
          //   },
          // },
          // {
          //   "type": "value:visible",
          //   "target": "endDateField",
          //   "condition": "{{ $self.value && $self.value !== 'norepeat' }}"
          // },
          // {
          //   "type": "value:visible",
          //   "target": "endTime",
          //   "condition": "{{ $self.value && $self.value !== 'norepeat' }}"
          // },
        ]
      },
    },
    {
      type: 'integer',
      name: 'times',
      developerMode: true,
    },
    {
      interface: 'select',
      type: 'string',
      name: 'endMode',
      title: '结束方式',
      required: true,
      // dataSource: [
      //   { label: '永不结束', value: 'never' },
      //   { label: '指定重复次数', value: 'repeatTime' },
      //   { label: '根据日期字段', value: 'customField' },
      //   { label: '自定义结束时间', value: 'customTime' },
      // ],
      component: {
        type: 'automations.endmode',
        showInDetail: true,
        showInForm: true,
        default: 'none',
        "x-linkages": [
          {
            "type": "value:visible",
            "target": "endTime",
            "condition": "{{ $self.value === 'byField' || $self.value === 'customTime' }}"
          },
          // {
          //   "type": "value:visible",
          //   "target": "endTime",
          //   "condition": "{{ $self.value === 'customTime' }}"
          // },
          {
            type: "value:schema",
            target: "endTime",
            condition: "{{ ($form.values.collection_name || $form.values.collection) && $self.value === 'customField' }}",
            schema: {
              "x-component-props": {
                "associatedKey": "{{ $form.values.collection_name || $form.values.collection }}"
              },
            },
          },
        ],
      },
    },
    // {
    //   interface: 'string',
    //   type: 'string',
    //   name: 'endDateField',
    //   title: '结束日期字段',
    //   required: true,
    //   labelField: 'title',
    //   valueField: 'name',
    //   component: {
    //     type: 'remoteSelect',
    //     showInDetail: true,
    //     showInForm: true,
    //     'x-component-props': {
    //       mode: 'simple',
    //       resourceName: 'collections.fields',
    //       labelField: 'title',
    //       valueField: 'name',
    //     },
    //   },
    // },
    {
      interface: 'json',
      type: 'json',
      name: 'endTime',
      title: '结束时间',
      showTime: true,
      required: true,
      component: {
        type: 'automations.datetime',
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
