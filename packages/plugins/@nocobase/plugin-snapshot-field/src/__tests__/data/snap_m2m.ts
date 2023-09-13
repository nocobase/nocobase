export const snap_m2m = {
  name: 'snap_m2m',
  type: 'snapshot',
  uiSchema: {
    'x-component': 'SnapshotRecordPicker',
    'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
    title: 'snap_m2m',
  },
  interface: 'snapshot',
  targetField: 'field_m2m',
  collectionName: 'table_b',
};
