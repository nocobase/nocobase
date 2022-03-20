export default {
  title: '条件判断',
  type: 'condition',
  fieldset: {
    calculation: {
      type: 'string',
      name: 'collection',
      'x-decorator': 'FormItem',
      'x-component': 'Calculation',
    },
    refjectOnFalse: {
      type: 'boolean',
      name: 'refjectOnFalse',
      title: '模式',
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      default: true,
      enum: [
        { value: true, label: '通行模式' },
        { value: false, label: '分支模式' },
      ],
    }
  },
  view: {

  }
};
