export const field_o2o = {
  foreignKey: 'fk_table_b',
  onDelete: 'SET NULL',
  name: 'field_o2o',
  type: 'hasOne',
  uiSchema: {
    'x-component': 'RecordPicker',
    'x-component-props': { multiple: false, fieldNames: { label: 'id', value: 'id' } },
    title: 'field_o2o',
  },
  interface: 'oho',
  target: 'table_a',
  collectionName: 'table_b',
};
