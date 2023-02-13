export const snap_linkto = {
  name: 'snap_linkto',
  type: 'snapshot',
  uiSchema: {
    'x-component': 'SnapshotRecordPicker',
    'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
    title: 'snap_linkto',
  },
  interface: 'snapshot',
  targetField: 'field_linkto',
  collectionName: 'table_b',
};
