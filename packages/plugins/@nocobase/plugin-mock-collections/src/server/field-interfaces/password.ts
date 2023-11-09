export const password = {
  options: () => ({
    type: 'password',
    hidden: true,
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Password',
    },
  }),
};
