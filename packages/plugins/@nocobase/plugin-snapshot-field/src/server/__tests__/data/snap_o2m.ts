export const snap_o2m = {
  name: 'snap_o2m',
  type: 'snapshot',
  uiSchema: {
    'x-component': 'SnapshotRecordPicker',
    'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
    title: 'snap_o2m',
  },
  interface: 'snapshot',
  targetField: 'field_o2m',
  collectionName: 'table_b',
};
