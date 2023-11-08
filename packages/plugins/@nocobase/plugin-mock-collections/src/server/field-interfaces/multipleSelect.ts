export const multipleSelect = (options) => ({
  interface: 'multipleSelect',
  type: 'array',
  defaultValue: [],
  // name,
  uiSchema: {
    type: 'array',
    'x-component': 'Select',
    'x-component-props': {
      mode: 'multiple',
    },
    enum: options?.uiSchema?.enum || [
      { value: 'option1', label: 'Option1' },
      { value: 'option2', label: 'Option2' },
      { value: 'option3', label: 'Option3' },
    ],
  },
});
