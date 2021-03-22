import { TableOptions } from '@nocobase/database';
import { LOG_TYPE_CREATE, LOG_TYPE_UPDATE, LOG_TYPE_DESTROY } from '../constants';

export default {
  name: 'action_logs',
  title: '操作记录',
  developerMode: true,
  internal: true,
  createdBy: false,
  updatedBy: false,
  updatedAt: false,
  logging: false,
  fields: [
    {
      interface: 'createdAt',
      name: 'created_at',
      type: 'date',
      title: '操作时间',
      showTime: true,
      component: {
        showInTable: true,
        showInDetail: true,
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'user',
      target: 'users',
      title: '操作用户',
      appends: true,
      labelField: 'nickname',
      component: {
        showInTable: true,
        showInDetail: true,
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      title: '数据表',
      targetKey: 'name',
      appends: true,
      labelField: 'title',
      component: {
        showInTable: true,
        showInDetail: true,
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'type',
      title: '操作类型',
      filterable: true,
      dataSource: [
        { value: LOG_TYPE_CREATE, label: '新增', color: 'blue' },
        { value: LOG_TYPE_UPDATE, label: '更新', color: 'volcano' },
        { value: LOG_TYPE_DESTROY, label: '删除', color: 'magenta' },
      ],
      component: {
        showInTable: true,
        showInDetail: true,
      },
    },
    {
      type: 'integer',
      name: 'index',
      title: '数据ID',
      component: {
        showInTable: true,
      },
    },
    {
      interface: 'subTable',
      type: 'hasMany',
      name: 'changes',
      target: 'action_changes',
      title: '数据变动',
      component: {
        showInDetail: true,
      },
    }
  ],
  actions: [
    {
      type: 'filter',
      name: 'filter',
      title: '筛选'
    },
    {
      type: 'list',
      name: 'list',
      title: '查看',
      // sort: '-created_at'
    },
  ],
  views_v2: [
    {
      developerMode: true,
      type: 'table',
      name: 'table',
      title: '全部数据',
      labelField: 'created_at',
      actions: [
        {
          name: 'filter',
          type: 'filter',
          title: '过滤',
        },
      ],
      fields: ['created_at', 'user', 'collection', 'type', 'index'],
      detailsOpenMode: 'drawer', // window
      details: ['descriptions'],
      sort: ['-created_at'],
    },
    {
      developerMode: true,
      type: 'table',
      name: 'create',
      title: '新增数据',
      labelField: 'created_at',
      actions: [
        {
          name: 'filter',
          type: 'filter',
          title: '过滤',
        },
      ],
      fields: ['created_at', 'user', 'collection', 'type', 'index'],
      detailsOpenMode: 'drawer', // window
      details: ['descriptions'],
      filter: {
        and: [
          {
            type: 'create',
          }
        ],
      },
      sort: ['-created_at'],
    },
    {
      developerMode: true,
      type: 'table',
      name: 'update',
      title: '更新数据',
      labelField: 'created_at',
      actions: [
        {
          name: 'filter',
          type: 'filter',
          title: '过滤',
        },
      ],
      fields: ['created_at', 'user', 'collection', 'type', 'index'],
      detailsOpenMode: 'drawer', // window
      details: ['descriptions'],
      filter: {
        and: [
          {
            type: 'update',
          }
        ],
      },
      sort: ['-created_at'],
    },
    {
      developerMode: true,
      type: 'table',
      name: 'destroy',
      title: '删除数据',
      labelField: 'created_at',
      actions: [
        {
          name: 'filter',
          type: 'filter',
          title: '过滤',
        },
      ],
      fields: ['created_at', 'user', 'collection', 'type', 'index'],
      detailsOpenMode: 'drawer', // window
      details: ['descriptions'],
      filter: {
        and: [
          {
            type: 'destroy',
          }
        ],
      },
      sort: ['-created_at'],
    },
    {
      type: 'table',
      name: 'table2',
      title: '操作日志列表',
      labelField: 'created_at',
      actions: [
        {
          name: 'filter',
          type: 'filter',
          title: '过滤',
        },
      ],
      fields: ['created_at', 'user', 'type', 'index'],
      detailsOpenMode: 'drawer', // window
      details: ['descriptions'],
      sort: ['created_at'],
    },
    {
      developerMode: true,
      type: 'descriptions',
      name: 'descriptions',
      title: '详情',
      fields: ['created_at', 'user', 'collection', 'type', 'index', 'changes'],
      actions: [],
    },
  ],
} as TableOptions;
