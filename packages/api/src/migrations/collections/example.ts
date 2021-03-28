import { TableOptions } from '@nocobase/database';

export default {
  title: '示例',
  name: 'examples',
  showInDataMenu: true,
  logging: false,
  // createdBy: true,
  // updatedBy: true,
  fields: [
    {
      interface: 'string',
      title: '单行文本',
      name: 'title',
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
      interface: 'boolean',
      title: '是/否',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'select',
      title: '下拉',
      dataSource: [
        { value: 'value1', label: '选项1' },
        { value: 'value2', label: '选项2' },
        { value: 'value3', label: '选项3' },
      ],
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'multipleSelect',
      title: '下拉多选',
      dataSource: [
        { value: 'value1', label: '选项1' },
        { value: 'value2', label: '选项2' },
        { value: 'value3', label: '选项3' },
      ],
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'radio',
      title: '单选框',
      dataSource: [
        { value: 'value1', label: '选项1' },
        { value: 'value2', label: '选项2' },
        { value: 'value3', label: '选项3' },
      ],
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'checkboxes',
      title: '多选框',
      dataSource: [
        { value: 'value1', label: '选项1' },
        { value: 'value2', label: '选项2' },
        { value: 'value3', label: '选项3' },
      ],
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'subTable',
      title: '子表格',
      children: [
        {
          interface: 'string',
          title: '标题',
          component: {
            showInTable: true,
            showInDetail: true,
            showInForm: true,
          },
        },
        {
          interface: 'textarea',
          title: '内容1',
          component: {
            showInTable: true,
            showInDetail: true,
            showInForm: true,
          },
        },
        {
          interface: 'textarea',
          title: '内容2',
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
      component: {
        // showInTable: true,
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
      interface: 'linkTo',
      type: 'belongsToMany',
      title: '关联1',
      target: 'examples',
      labelField: 'title',
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
