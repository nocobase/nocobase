export const snap_o2o = {
  name: 'snap_o2o',
  type: 'snapshot',
  uiSchema: {
    'x-component': 'SnapshotRecordPicker',
    'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
    title: 'snap_o2o',
  },
  interface: 'snapshot',
  targetField: 'field_o2o',
  appends: ['createdBy'],
  collectionName: 'table_b',
};
