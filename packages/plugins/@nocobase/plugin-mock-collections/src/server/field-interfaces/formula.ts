export const formula = {
  options: () => ({
    type: 'formula',
    dataType: 'double',
    engine: 'math.js',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Formula.Result',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
      'x-read-pretty': true,
    },
  }),
};
