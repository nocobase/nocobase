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
  ],
};
