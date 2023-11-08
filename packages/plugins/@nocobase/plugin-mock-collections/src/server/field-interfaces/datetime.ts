export const datetime = () => ({
  type: 'date',
  // name,
  uiSchema: {
    type: 'string',
    // title,
    'x-component': 'DatePicker',
    'x-component-props': {
      dateFormat: 'YYYY-MM-DD',
      showTime: false,
    },
  },
});
