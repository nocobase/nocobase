export const updatedAt = {
  options: () => ({
    type: 'date',
    field: 'updatedAt',
    // name,
    uiSchema: {
      type: 'string',
      title: '{{t("Last updated at")}}',
      'x-component': 'DatePicker',
      'x-component-props': {},
      'x-read-pretty': true,
    },
  }),
};
