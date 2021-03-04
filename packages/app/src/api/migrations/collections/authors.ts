import { TableOptions } from '@nocobase/database';

export default {
  title: '作者',
  showInDataMenu: true,
  name: 'authors',
  // createdBy: true,
  // updatedBy: true,
  fields: [
    {
      interface: 'string',
      title: '姓名',
      name: 'name',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'radio',
      title: '性别',
      dataSource: [
        {value: 'male', label: '男性'},
        {value: 'female', label: '女性'},
      ],
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'attachment',
      title: '头像',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsToMany',
      title: '书籍',
      name: 'books',
      target: 'books',
      labelField: 'name',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'createdBy',
      title: '创建人',
      component: {
        showInTable: true,
        showInDetail: true,
        // showInForm: true,
      },
    },
    {
      interface: 'updatedBy',
      title: '更新人',
      component: {
        showInTable: true,
        showInDetail: true,
        // showInForm: true,
      },
    },
    {
      interface: 'createdAt',
      title: '创建日期',
      component: {
        showInTable: true,
        showInDetail: true,
        // showInForm: true,
      },
    },
    {
      interface: 'updatedAt',
      title: '更新日期',
      component: {
        showInTable: true,
        showInDetail: true,
        // showInForm: true,
      },
    }
  ],
  views_v2: [
    {
      type: 'table',
      name: 'table',
      title: '全部数据',
      labelField: 'name',
      actions: [
        {
          name: 'filter',
          type: 'filter',
          title: '过滤',
          // viewName: 'form',
        },
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
      fields: ['name'],
      openMode: 'drawer', // window
      pages: ['details', 'books'],
      sort: ['id'],
    },
    {
      type: 'details',
      name: 'details',
      title: '详情',
      fields: ['name'],
      actions: [
        {
          name: 'update',
          type: 'update',
          title: '编辑',
          viewName: 'form',
        },
      ],
    },
    {
      type: 'form',
      name: 'form',
      title: '表单',
      fields: ['name'],
    },
    {
      type: 'association',
      name: 'books',
      title: '书籍',
      targetViewName: 'table',
      targetFieldName: 'books',
    },
  ],
  pages_v2: [
    {
      title: '全部数据',
      name: 'all',
      views: ['table'],
    },
    {
      title: '详情',
      name: 'details',
      views: ['details'],
    },
    {
      title: '表单',
      name: 'form',
      views: ['form'],
    },
    {
      title: '书籍',
      name: 'books',
      views: ['books'],
    },
  ],
};
