export const percent = () => ({
  type: 'float',
  // name,
  uiSchema: {
    type: 'string',
    // title,
    'x-component': 'Percent',
    'x-component-props': {
      stringMode: true,
      step: '1',
      addonAfter: '%',
    },
  },
});
