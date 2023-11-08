export const number = () => ({
  type: 'double',
  // name,
  uiSchema: {
    type: 'number',
    // title,
    'x-component': 'InputNumber',
    'x-component-props': {
      stringMode: true,
      step: '1',
    },
  },
});
