export const password = () => ({
  type: 'password',
  hidden: true,
  // name,
  uiSchema: {
    type: 'string',
    // title,
    'x-component': 'Password',
  },
});
