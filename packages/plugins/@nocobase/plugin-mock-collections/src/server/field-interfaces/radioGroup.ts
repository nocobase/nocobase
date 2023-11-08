export const radioGroup = (options) => ({
  interface: 'radioGroup',
  type: 'string',
  defaultValue: [],
  // name,
  uiSchema: {
    type: 'string',
    'x-component': 'Radio.Group',
    enum: options?.uiSchema?.enum || [
      { value: 'option1', label: 'Option1' },
      { value: 'option2', label: 'Option2' },
      { value: 'option3', label: 'Option3' },
    ],
  },
});
