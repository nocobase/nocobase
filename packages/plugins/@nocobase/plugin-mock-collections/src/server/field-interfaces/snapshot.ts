export const snapshot = () => ({
  type: 'snapshot',
  // name,
  uiSchema: {
    // title,
    'x-component': 'SnapshotRecordPicker',
    'x-component-props': {
      multiple: true,
      fieldNames: {
        label: 'id',
        value: 'id',
      },
    },
  },
});
