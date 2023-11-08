export const attachment = (options) => ({
  type: 'belongsToMany',
  target: 'attachments',
  // name,
  uiSchema: {
    type: 'array',
    // title,
    'x-component': 'Upload.Attachment',
    'x-component-props': {},
  },
});
