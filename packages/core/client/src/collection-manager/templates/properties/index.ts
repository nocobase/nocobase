import { css } from '@emotion/css';

const moreOptions = {
  autoGenId: {
    type: 'boolean',
    'x-content': '{{t("Generate ID field automatically")}}',
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
    'x-content': '{{t("Store the creation user of each record")}}',
    default: true,
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
    'x-disabled': '{{ !createOnly }}',
  },
  updatedBy: {
    type: 'boolean',
    'x-content': '{{t("Store the last update user of each record")}}',
    default: true,
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
    'x-disabled': '{{ !createOnly }}',
  },
  createdAt: {
    type: 'boolean',
    'x-content': '{{t("Store the creation time of each record")}}',
    default: true,
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
    'x-disabled': '{{ !createOnly }}',
  },
  updatedAt: {
    type: 'boolean',
    'x-content': '{{t("Store the last update time of each record")}}',
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
    'x-reactions': ['{{useAsyncDataSource(loadCollections, ["file"])}}'],
  },
  category: {
    title: '{{t("Categories")}}',
    type: 'hasMany',
    name: 'category',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    'x-component-props': {
      mode: 'multiple',
    },
    'x-reactions': ['{{useAsyncDataSource(loadCategories)}}'],
  },
  description: {
    title: '{{t("Description")}}',
    type: 'string',
    name: 'description',
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
  },
  ...moreOptions,
  moreOptions: {
    title: '{{t("More options")}}',
    type: 'void',
    'x-decorator': 'FormItem',
    'x-decorator-props': {
      className: css`
        .ant-formily-item {
          margin-bottom: 0;
        }
      `,
    },
    properties: {
      ...moreOptions,
    },
  },
};

export type DefaultConfigurableKeys =
  | 'name'
  | 'title'
  | 'inherits'
  | 'category'
  | 'autoGenId'
  | 'createdBy'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
  | 'sortable'
  | 'description'
  | 'moreOptions';

export const getConfigurableProperties = (...keys: DefaultConfigurableKeys[]) => {
  const props = {} as Record<DefaultConfigurableKeys, any>;
  for (const key of keys) {
    if (defaultConfigurableProperties[key]) {
      props[key] = defaultConfigurableProperties[key];
    }
  }
  return props;
};
