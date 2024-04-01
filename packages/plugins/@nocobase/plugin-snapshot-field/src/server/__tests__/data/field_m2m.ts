export const field_m2m = {
  foreignKey: 'fk_table_b',
  otherKey: 'fk_table_a',
  name: 'field_m2m',
  type: 'belongsToMany',
  uiSchema: {
    'x-component': 'RecordPicker',
    'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
    title: 'field_m2m',
  },
  interface: 'm2m',
  through: 'table_m2m',
  target: 'table_a',
  collectionName: 'table_b',
};
