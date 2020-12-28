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
      interface: 'number',
      title: '年龄',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    // {
    //   interface: 'linkTo',
    //   title: '书籍',
    //   target: 'books',
    //   labelField: 'name',
    //   component: {
    //     showInTable: true,
    //     showInDetail: true,
    //     showInForm: true,
    //   },
    // },
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
};
