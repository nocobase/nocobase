export const defaultConfigurableProperties = {
  title: {
    type: 'string',
    title: '{{ t("Collection display name") }}',
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  name: {
    type: 'string',
    title: '{{t("Collection name")}}',
    required: true,
    'x-disabled': '{{ !createOnly }}',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-validator': 'uid',
    description:
      "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
  },
  inherits: {
    title: '{{t("Inherits")}}',
    type: 'hasMany',
    name: 'inherits',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    'x-component-props': {
      mode: 'multiple',
    },
    'x-disabled': '{{ !createOnly }}',
    'x-visible': '{{ enableInherits}}',
    'x-reactions': ['{{useAsyncDataSource(loadCollections)}}'],
  },
  autoGenId: {
    type: 'boolean',
    'x-content': '{{t("AutoGenId")}}',
    default: true,
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
    'x-disabled': '{{ !createOnly }}',
    'x-reactions': [
      {
        target: 'sortable',
        when: '{{createOnly&&!$self.value}}',
        fulfill: {
          state: {
            value: false,
          },
          schema: {
            'x-disabled': true,
          },
        },
        otherwise: {
          schema: {
            'x-disabled': '{{!createOnly}}',
          },
        },
      },
    ],
  },
  createdBy: {
    type: 'boolean',
    'x-content': '{{t("CreatedBy")}}',
    default: true,
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
    'x-disabled': '{{ !createOnly }}',
  },
  updatedBy: {
    type: 'boolean',
    'x-content': '{{t("UpdatedBy")}}',
    default: true,
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
    'x-disabled': '{{ !createOnly }}',
  },
  createdAt: {
    type: 'boolean',
    'x-content': '{{t("CreatedAt")}}',
    default: true,
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
    'x-disabled': '{{ !createOnly }}',
  },
  updatedAt: {
    type: 'boolean',
    'x-content': '{{t("UpdatedAt")}}',
    default: true,
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
    'x-disabled': '{{ !createOnly }}',
  },
  sortable: {
    type: 'boolean',
    'x-content': '{{t("Records can be sorted")}}',
    default: true,
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
    'x-disabled': '{{ !createOnly }}',
  },
};

export type DefaultConfigurableKeys =
  | 'name'
  | 'title'
  | 'inherits'
  | 'autoGenId'
  | 'createdBy'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
  | 'sortable';

export const getConfigurableProperties = (...keys: DefaultConfigurableKeys[]) => {
  const props = {};
  for (const key of keys) {
    if (defaultConfigurableProperties[key]) {
      props[key] = defaultConfigurableProperties[key];
    }
  }
  return props;
};
