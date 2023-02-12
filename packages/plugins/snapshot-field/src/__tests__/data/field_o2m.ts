export const field_o2m = {
  foreignKey: 'fk_table_b',
  onDelete: 'SET NULL',
  name: 'field_o2m',
  type: 'hasMany',
  uiSchema: {
    'x-component': 'RecordPicker',
    'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
    title: 'field_o2m',
  },
  interface: 'o2m',
  target: 'table_a',
  collectionName: 'table_b',
};
