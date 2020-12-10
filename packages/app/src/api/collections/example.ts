import { TableOptions } from '@nocobase/database';

export default {
  title: '示例',
  showInDataMenu: true,
  fields: [
    {
      interface: 'string',
      title: '单行文本',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'textarea',
      title: '多行文本',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'phone',
      title: '手机号',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'email',
      title: '邮箱',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'number',
      title: '数字',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'percent',
      title: '百分比',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'datetime',
      title: '日期',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'time',
      title: '时间',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
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
};
