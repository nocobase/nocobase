import { faker } from '@faker-js/faker';
import { uid } from '@nocobase/utils';

function reverseFieldHandle(defaults, { target, reverseField }) {
  if (!reverseField) {
    delete defaults.reverseField;
  } else {
    Object.assign(defaults.reverseField, reverseField);
    if (!defaults.reverseField.name) {
      defaults.reverseField.name = `f_${uid()}`;
    }
    if (reverseField.title && defaults.reverseField.uiSchema) {
      defaults.reverseField.uiSchema['title'] = reverseField.title;
    }
    if (!defaults.reverseField.uiSchema['title']) {
      defaults.reverseField.uiSchema['title'] = defaults.reverseField.name;
    }
    if (!defaults.key) {
      defaults.key = uid();
    }
    if (!defaults.reverseField.key) {
      defaults.reverseField.key = uid();
    }
    defaults['reverseKey'] = defaults.reverseField.key;
    defaults.reverseField.reverseKey = defaults.key;
    defaults.reverseField.collectionName = target;
  }
  return defaults;
}

function generateForeignKeyField(options) {
  return options.type === 'bigInt'
    ? {
        key: uid(),
        ...options,
        interface: 'integer',
        isForeignKey: true,
        sort: 1,
        uiSchema: {
          type: 'number',
          title: options.name,
          'x-component': 'InputNumber',
          'x-read-pretty': true,
        },
      }
    : {
        key: uid(),
        ...options,
        interface: 'input',
        isForeignKey: true,
        sort: 1,
        uiSchema: {
          type: 'string',
          title: options.name,
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      };
}

export const oho = {
  options: (options) => {
    const { foreignKey = `f_${uid()}`, targetKey = 'id', sourceKey = 'id', reverseField } = options;
    const defaults = {
      type: 'hasOne',
      foreignKey,
      sourceKey,
      // name,
      uiSchema: {
        // title,
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
      reverseField: {
        interface: 'obo',
        type: 'belongsTo',
        foreignKey,
        targetKey: sourceKey,
        uiSchema: {
          // title,
          'x-component': 'AssociationField',
          'x-component-props': {
            // mode: 'tags',
            multiple: false,
            fieldNames: {
              label: sourceKey,
              value: sourceKey,
            },
          },
        },
      },
    };
    defaults['foreignKeyFields'] = [
      generateForeignKeyField({
        type: sourceKey === 'id' ? 'bigInt' : 'string',
        name: foreignKey,
        collectionName: options.target,
      }),
    ];
    return reverseFieldHandle(defaults, options);
  },
  mock: async (options, { mockCollectionData, maxDepth, depth }) => {
    return mockCollectionData(options.target, 1, depth + 1, maxDepth);
  },
};

export const obo = {
  options: (options) => {
    const { foreignKey = `f_${uid()}`, targetKey = 'id', sourceKey = 'id', reverseField } = options;
    const key = uid();
    const defaults = {
      type: 'belongsTo',
      foreignKey,
      targetKey,
      // name,
      uiSchema: {
        // title,
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
      reverseField: {
        interface: 'oho',
        type: 'hasOne',
        foreignKey,
        sourceKey: targetKey,
        uiSchema: {
          // title,
          'x-component': 'AssociationField',
          'x-component-props': {
            multiple: false,
            fieldNames: {
              label: sourceKey,
              value: sourceKey,
            },
          },
        },
      },
    };
    defaults['foreignKeyFields'] = [
      generateForeignKeyField({
        type: targetKey === 'id' ? 'bigInt' : 'string',
        name: foreignKey,
        collectionName: options.collectionName,
      }),
    ];
    return reverseFieldHandle(defaults, options);
  },
  mock: async (options, { mockCollectionData, depth, maxDepth }) => {
    return mockCollectionData(options.target, 1, depth + 1, maxDepth);
  },
};

export const o2m = {
  options: (options) => {
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
        targetKey: sourceKey,
        uiSchema: {
          // title: `T-${uid()}`,
          'x-component': 'AssociationField',
          'x-component-props': {
            // mode: 'tags',
            multiple: false,
            fieldNames: {
              label: sourceKey,
              value: sourceKey,
            },
          },
        },
      },
    };
    defaults['foreignKeyFields'] = [
      generateForeignKeyField({
        type: sourceKey === 'id' ? 'bigInt' : 'string',
        name: foreignKey,
        collectionName: options.target,
      }),
    ];
    return reverseFieldHandle(defaults, options);
  },
  mock: async (options, { mockCollectionData, depth, maxDepth }) => {
    return mockCollectionData(options.target, faker.number.int({ min: 2, max: 5 }), depth + 1, maxDepth);
  },
};

export const m2o = {
  options: (options) => {
    const { foreignKey = `f_${uid()}`, targetKey = 'id', sourceKey = 'id', reverseField } = options;
    const defaults = {
      type: 'belongsTo',
      foreignKey,
      targetKey,
      // name,
      uiSchema: {
        // title,
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
      reverseField: {
        interface: 'o2m',
        type: 'hasMany',
        foreignKey,
        targetKey: sourceKey,
        sourceKey: targetKey,
        // name,
        uiSchema: {
          // title,
          'x-component': 'AssociationField',
          'x-component-props': {
            // mode: 'tags',
            multiple: true,
            fieldNames: {
              label: sourceKey,
              value: sourceKey,
            },
          },
        },
      },
    };
    defaults['foreignKeyFields'] = [
      generateForeignKeyField({
        type: targetKey === 'id' ? 'bigInt' : 'string',
        name: foreignKey,
        collectionName: options.collectionName,
      }),
    ];
    return reverseFieldHandle(defaults, options);
  },
  mock: async (options, { mockCollectionData, depth, maxDepth }) => {
    return mockCollectionData(options.target, 1, depth + 1, maxDepth);
  },
};

export const m2m = {
  options: (options) => {
    const {
      through = `t_${uid()}`,
      foreignKey = `f_${uid()}`,
      otherKey = `f_${uid()}`,
      targetKey = 'id',
      sourceKey = 'id',
      reverseField,
    } = options;
    const defaults = {
      type: 'belongsToMany',
      through,
      foreignKey,
      otherKey,
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
        interface: 'm2m',
        type: 'belongsToMany',
        through,
        foreignKey: otherKey,
        otherKey: foreignKey,
        targetKey: sourceKey,
        sourceKey: targetKey,
        // name,
        uiSchema: {
          // title,
          'x-component': 'AssociationField',
          'x-component-props': {
            // mode: 'tags',
            multiple: true,
            fieldNames: {
              label: sourceKey,
              value: sourceKey,
            },
          },
        },
      },
    };
    defaults['foreignKeyFields'] = [
      generateForeignKeyField({
        type: sourceKey === 'id' ? 'bigInt' : 'string',
        name: foreignKey,
        collectionName: through,
      }),
      generateForeignKeyField({
        type: targetKey === 'id' ? 'bigInt' : 'string',
        name: otherKey,
        collectionName: through,
      }),
    ];
    defaults['throughCollection'] = {
      key: uid(),
      name: through,
      title: through,
      timestamps: true,
      autoGenId: false,
      hidden: true,
      autoCreate: true,
      isThrough: true,
      sortable: false,
    };
    return reverseFieldHandle(defaults, options);
  },
  mock: async (options, { mockCollectionData, depth, maxDepth }) => {
    return mockCollectionData(options.target, faker.number.int({ min: 2, max: 5 }), depth + 1, maxDepth);
  },
};
