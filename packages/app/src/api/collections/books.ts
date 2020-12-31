import { TableOptions } from '@nocobase/database';

export default {
  title: '书籍',
  showInDataMenu: true,
  name: 'books',
  // createdBy: true,
  // updatedBy: true,
  fields: [
    {
      interface: 'string',
      title: '书籍名称',
      name: 'name',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'attachment',
      title: '封面',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    // {
    //   interface: 'linkTo',
    //   title: '作者',
    //   target: 'authors',
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
