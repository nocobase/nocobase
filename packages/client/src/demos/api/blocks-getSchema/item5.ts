export default {
  name: 'arr',
  type: 'array',
  'x-component': 'Table',
  default: [{ field1: 'a', field2: 'b' }, { field1: 'a', field2: 'b' }],
  'x-component-props': {},
  properties: {
    actionBar1: {
      type: 'void',
      'x-component': 'Table.ActionBar',
      properties: {
        action1: {
          type: 'object',
          title: '按钮1',
          'x-component': 'Table.Action.Popover',
          'x-component-props': {
          },
          properties: {

          },
        },
        action2: {
          type: 'void',
          title: '按钮2',
          'x-component': 'Table.Action.Button',
          'x-component-props': {
            label: '按钮2',
          },
        },
      },
    },
    actionBar2: {
      type: 'void',
      'x-component': 'Table.ActionBar',
      'x-component-props': {
        align: 'bottom',
      },
      properties: {
        pagination: {
          type: 'void',
          'x-component': 'Table.Pagination',
          'x-component-props': {
            defaultCurrent: 1,
            total: 50,
          },
        },
      },
    },
    details: {
      type: 'void',
      'x-component': 'Table.Details',
      properties: {},
    },
    col1: {
      type: 'void',
      title: '字段1',
      'x-component': 'Table.Column',
      'x-component-props': {
        title: 'z1',
        width: 100,
      },
      properties: {
        field1: {
          type: 'string',
          required: true,
          'x-decorator-props': {
            feedbackLayout: 'popover',
          },
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    },
    col2: {
      type: 'void',
      title: '字段2',
      'x-component': 'Table.Column',
      properties: {
        field2: {
          type: 'string',
          title: '字段2',
          required: true,
          'x-decorator-props': {
            feedbackLayout: 'popover',
          },
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    },
  },
}