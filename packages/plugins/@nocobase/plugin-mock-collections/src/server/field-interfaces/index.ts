import { uid } from '@nocobase/utils';

export default {
  input: () => ({
    interface: 'input',
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
    },
  }),
  o2m: (options) => {
    const { foreignKey = `f_${uid()}`, targetKey = 'id', sourceKey = 'id', reverseField } = options;
    const defaults = {
      type: 'hasMany',
      foreignKey,
      targetKey,
      sourceKey,
      // name,
      uiSchema: {
        // title,
        'x-component': 'AssociationField',
        'x-component-props': {
          // mode: 'tags',
          multiple: true,
          fieldNames: {
            label: targetKey,
            value: targetKey,
          },
        },
      },
      reverseField: {
        interface: 'm2o',
        type: 'belongsTo',
        foreignKey,
        targetKey,
        name: `f_${uid()}`,
        uiSchema: {
          // title: `T-${uid()}`,
          'x-component': 'AssociationField',
          'x-component-props': {
            // mode: 'tags',
            multiple: false,
            fieldNames: {
              label: targetKey,
              value: targetKey,
            },
          },
        },
      },
    };
    if (!reverseField) {
      delete defaults.reverseField;
    } else {
      Object.assign(defaults.reverseField, reverseField);
      if (reverseField.title && defaults.reverseField.uiSchema) {
        defaults.reverseField.uiSchema['title'] = reverseField.title;
      }
      if (!defaults.reverseField.uiSchema['title']) {
        defaults.reverseField.uiSchema['title'] = defaults.reverseField.name;
      }
    }
    return defaults;
  },
  // oho: (options) => {
  //   const { foreignKey = `f_${uid()}`, targetKey = 'id', sourceKey = 'id', reverseField } = options;
  //   const defaults = {
  //     type: 'hasMany',
  //     foreignKey,
  //     targetKey,
  //     sourceKey,
  //     // name,
  //     uiSchema: {
  //       // title,
  //       'x-component': 'AssociationField',
  //       'x-component-props': {
  //         // mode: 'tags',
  //         multiple: true,
  //         fieldNames: {
  //           label: targetKey,
  //           value: targetKey,
  //         },
  //       },
  //     },
  //     reverseField: {
  //       interface: 'm2o',
  //       type: 'belongsTo',
  //       foreignKey,
  //       targetKey,
  //       name: `f_${uid()}`,
  //       uiSchema: {
  //         'x-component': 'AssociationField',
  //         'x-component-props': {
  //           // mode: 'tags',
  //           multiple: false,
  //           fieldNames: {
  //             label: targetKey,
  //             value: targetKey,
  //           },
  //         },
  //       },
  //     },
  //   };
  //   if (!reverseField) {
  //     delete defaults.reverseField;
  //   } else {
  //     Object.assign(defaults.reverseField, reverseField);
  //     if (reverseField.title && defaults.reverseField.uiSchema) {
  //       defaults.reverseField.uiSchema['title'] = reverseField.title;
  //     }
  //     if (!defaults.reverseField.uiSchema['title']) {
  //       defaults.reverseField.uiSchema['title'] = defaults.reverseField.name;
  //     }
  //   }
  //   return defaults;
  // },
  // obo: (options) => {
  //   const { foreignKey = `f_${uid()}`, targetKey = 'id', sourceKey = 'id', reverseField } = options;
  //   const defaults = {
  //     type: 'hasMany',
  //     foreignKey,
  //     targetKey,
  //     sourceKey,
  //     // name,
  //     uiSchema: {
  //       // title,
  //       'x-component': 'AssociationField',
  //       'x-component-props': {
  //         // mode: 'tags',
  //         multiple: true,
  //         fieldNames: {
  //           label: targetKey,
  //           value: targetKey,
  //         },
  //       },
  //     },
  //     reverseField: {
  //       interface: 'm2o',
  //       type: 'belongsTo',
  //       foreignKey,
  //       targetKey,
  //       name: `f_${uid()}`,
  //       uiSchema: {
  //         title: `T-${uid()}`,
  //         'x-component': 'AssociationField',
  //         'x-component-props': {
  //           // mode: 'tags',
  //           multiple: false,
  //           fieldNames: {
  //             label: targetKey,
  //             value: targetKey,
  //           },
  //         },
  //       },
  //     },
  //   };
  //   if (!reverseField) {
  //     delete defaults.reverseField;
  //   } else {
  //     Object.assign(defaults.reverseField, reverseField);
  //     if (reverseField.title && defaults.reverseField.uiSchema) {
  //       defaults.reverseField.uiSchema.title = reverseField.title;
  //     }
  //   }
  //   return defaults;
  // },
  // m2o: (options) => {
  //   const { foreignKey = `f_${uid()}`, targetKey = 'id', sourceKey = 'id', reverseField } = options;
  //   const defaults = {
  //     type: 'hasMany',
  //     foreignKey,
  //     targetKey,
  //     sourceKey,
  //     // name,
  //     uiSchema: {
  //       // title,
  //       'x-component': 'AssociationField',
  //       'x-component-props': {
  //         // mode: 'tags',
  //         multiple: true,
  //         fieldNames: {
  //           label: targetKey,
  //           value: targetKey,
  //         },
  //       },
  //     },
  //     reverseField: {
  //       interface: 'm2o',
  //       type: 'belongsTo',
  //       foreignKey,
  //       targetKey,
  //       name: `f_${uid()}`,
  //       uiSchema: {
  //         title: `T-${uid()}`,
  //         'x-component': 'AssociationField',
  //         'x-component-props': {
  //           // mode: 'tags',
  //           multiple: false,
  //           fieldNames: {
  //             label: targetKey,
  //             value: targetKey,
  //           },
  //         },
  //       },
  //     },
  //   };
  //   if (!reverseField) {
  //     delete defaults.reverseField;
  //   } else {
  //     Object.assign(defaults.reverseField, reverseField);
  //     if (reverseField.title && defaults.reverseField.uiSchema) {
  //       defaults.reverseField.uiSchema.title = reverseField.title;
  //     }
  //   }
  //   return defaults;
  // },
  // m2m: (options) => {
  //   const { foreignKey = `f_${uid()}`, targetKey = 'id', sourceKey = 'id', reverseField } = options;
  //   const defaults = {
  //     type: 'hasMany',
  //     foreignKey,
  //     targetKey,
  //     sourceKey,
  //     // name,
  //     uiSchema: {
  //       // title,
  //       'x-component': 'AssociationField',
  //       'x-component-props': {
  //         // mode: 'tags',
  //         multiple: true,
  //         fieldNames: {
  //           label: targetKey,
  //           value: targetKey,
  //         },
  //       },
  //     },
  //     reverseField: {
  //       interface: 'm2o',
  //       type: 'belongsTo',
  //       foreignKey,
  //       targetKey,
  //       name: `f_${uid()}`,
  //       uiSchema: {
  //         title: `T-${uid()}`,
  //         'x-component': 'AssociationField',
  //         'x-component-props': {
  //           // mode: 'tags',
  //           multiple: false,
  //           fieldNames: {
  //             label: targetKey,
  //             value: targetKey,
  //           },
  //         },
  //       },
  //     },
  //   };
  //   if (!reverseField) {
  //     delete defaults.reverseField;
  //   } else {
  //     Object.assign(defaults.reverseField, reverseField);
  //     if (reverseField.title && defaults.reverseField.uiSchema) {
  //       defaults.reverseField.uiSchema.title = reverseField.title;
  //     }
  //   }
  //   return defaults;
  // },
};
