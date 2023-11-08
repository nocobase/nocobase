export const integer = () => ({
  type: 'bigInt',
  // name,
  uiSchema: {
    type: 'number',
    // title,
    'x-component': 'InputNumber',
    'x-component-props': {
      stringMode: true,
      step: '1',
    },
    'x-validator': 'integer',
  },
});
