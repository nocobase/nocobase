export default {
  Nester: {
    type: 'void',
    'x-component': 'AssociationField.Nester',
    properties: {
      grid: {
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'FormItemInitializers',
      },
    },
  },
  AddNewer: {
    type: 'void',
    'x-component': 'AssociationField.AddNewer',
    title: 'Drawer Title',
    properties: {
      hello1: {
        'x-content': 'AddNewer',
        title: 'T1',
      },
    },
  },
  Selector: {
    type: 'void',
    'x-component': 'AssociationField.Selector',
    title: 'Drawer Title',
    properties: {
      hello1: {
        'x-content': 'Selector',
        title: 'T1',
      },
    },
  },
  Viewer: {
    type: 'void',
    'x-component': 'AssociationField.Viewer',
    title: 'Drawer Title',
    properties: {
      hello1: {
        'x-content': 'Viewer',
        title: 'T1',
      },
    },
  }
};
