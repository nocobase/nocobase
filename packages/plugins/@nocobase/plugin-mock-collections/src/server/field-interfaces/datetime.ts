export const datetime = () => ({
  type: 'date',
  // name,
  uiSchema: {
    type: 'string',
    // title,
    'x-component': 'DatePicker',
    'x-component-props': {
      showTime: false,
    },
  },
});
