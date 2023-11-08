export const email = () => ({
  type: 'string',
  // name,
  uiSchema: {
    type: 'string',
    // title,
    'x-component': 'Input',
    'x-validator': 'email',
  },
});
