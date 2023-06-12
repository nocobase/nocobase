export const PageSchema = {
  type: 'void',
  'x-component': 'MPage',
  'x-designer': 'MPage.Designer',
  'x-component-props': {},
  properties: {
    grid: {
      type: 'void',
      'x-component': 'Grid',
      'x-initializer': 'MBlockInitializers',
      'x-component-props': {
        showDivider: false,
      },
    },
  },
};
