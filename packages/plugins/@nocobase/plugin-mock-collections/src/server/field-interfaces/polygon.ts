export const polygon = {
  options: () => ({
    type: 'polygon',
    uiSchema: {
      type: 'void',
      'x-component': 'Map',
      'x-component-designer': 'Map.Designer',
      'x-component-props': {
        mapType: 'amap',
      },
    },
  }),
};
