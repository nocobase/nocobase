export const publicFormsCollection = {
  name: 'publicForms',
  filterTargetKey: 'key',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '标题',
        required: true,
        'x-component': 'Input',
      },
    },
    {
      type: 'text',
      name: 'description',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '描述',
        'x-component': 'Input.TextArea',
      },
    },
    {
      type: 'string',
      name: 'type',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '类型',
        'x-component': 'Radio.Group',
      },
    },
    {
      type: 'string',
      name: 'collection',
      interface: 'collection',
      uiSchema: {
        type: 'string',
        title: '数据表',
        required: true,
        'x-component': 'CollectionSelect',
      },
    },
    {
      type: 'password',
      name: 'password',
      interface: 'password',
      uiSchema: {
        type: 'string',
        title: '密码',
        'x-component': 'Password',
      },
    },
    {
      type: 'boolean',
      name: 'enabled',
      interface: 'checkbox',
      uiSchema: {
        type: 'string',
        title: '是否启用',
        'x-component': 'Checkbox',
      },
    },
  ],
};
