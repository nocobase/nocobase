export const field_linkto = {
  name: 'field_linkto',
  type: 'belongsToMany',
  uiSchema: {
    'x-component': 'RecordPicker',
    'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
    title: 'field_linkto',
  },
  interface: 'linkTo',
  target: 'table_a',
  collectionName: 'table_b',
};
