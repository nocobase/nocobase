import { useForm } from '@formily/react';
import { css, parseCollectionName, useCollectionFilterOptions } from '@nocobase/client';
import { NAMESPACE } from '../locale';

export const collection = {
  type: 'string',
  title: '{{t("Collection")}}',
  required: true,
  'x-reactions': [],
  'x-decorator': 'FormItem',
  'x-component': 'DataSourceCollectionCascader',
};

export const values = {
  type: 'object',
  title: '{{t("Fields values")}}',
  description: `{{t("Unassigned fields will be set to default values, and those without default values will be set to null.", { ns: "${NAMESPACE}" })}}`,
  'x-decorator': 'FormItem',
  'x-decorator-props': {
    labelAlign: 'left',
    className: css`
      flex-direction: column;
    `,
  },
  'x-component': 'CollectionFieldset',
};

export const filter = {
  type: 'object',
  title: '{{t("Filter")}}',
  'x-decorator': 'FormItem',
  'x-component': 'Filter',
  'x-component-props': {
    useProps() {
      const { values } = useForm();
      const [dataSourceName, collectionName] = parseCollectionName(values?.collection);
      const options = useCollectionFilterOptions(collectionName, dataSourceName);
      return {
        options,
        className: css`
          position: relative;
          width: 100%;
        `,
      };
    },
    dynamicComponent: 'FilterDynamicComponent',
  },
};

export const sort = {
  type: 'array',
  title: '{{t("Sort")}}',
  'x-decorator': 'FormItem',
  'x-component': 'ArrayItems',
  items: {
    type: 'object',
    properties: {
      space: {
        type: 'void',
        'x-component': 'Space',
        properties: {
          sort: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.SortHandle',
          },
          field: {
            type: 'string',
            enum: '{{useSortableFields()}}',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            'x-component-props': {
              style: {
                width: 260,
              },
            },
          },
          direction: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
            'x-component-props': {
              optionType: 'button',
            },
            enum: [
              {
                label: '{{t("ASC")}}',
                value: 'asc',
              },
              {
                label: '{{t("DESC")}}',
                value: 'desc',
              },
            ],
          },
          remove: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.Remove',
          },
        },
      },
    },
  },
  properties: {
    add: {
      type: 'void',
      title: '{{t("Add sort field")}}',
      'x-component': 'ArrayItems.Addition',
    },
  },
};

export const pagination = {
  type: 'void',
  title: '{{t("Pagination")}}',
  'x-decorator': 'SchemaComponentContext.Provider',
  'x-decorator-props': {
    value: { designable: false },
  },
  'x-component': 'Grid',
  properties: {
    row: {
      type: 'void',
      'x-component': 'Grid.Row',
      properties: {
        page: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            page: {
              type: 'number',
              title: '{{t("Page number")}}',
              'x-decorator': 'FormItem',
              'x-component': 'WorkflowVariableInput',
              'x-component-props': {
                useTypedConstant: ['number', 'null'],
              },
              default: 1,
            },
          },
        },
        pageSize: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            pageSize: {
              type: 'number',
              title: '{{t("Page size")}}',
              'x-decorator': 'FormItem',
              'x-component': 'InputNumber',
              'x-component-props': {
                min: 1,
                max: 100,
              },
              default: 20,
            },
          },
        },
      },
    },
  },
};

export const appends = {
  type: 'array',
  title: `{{t("Preload associations", { ns: "${NAMESPACE}" })}}`,
  description: `{{t("Please select the associated fields that need to be accessed in subsequent nodes. With more than two levels of to-many associations may cause performance issue, please use with caution.", { ns: "${NAMESPACE}" })}}`,
  'x-decorator': 'FormItem',
  'x-component': 'AppendsTreeSelect',
  'x-component-props': {
    title: 'Preload associations',
    multiple: true,
    useCollection() {
      const { values } = useForm();
      return values?.collection;
    },
  },
  'x-reactions': [
    {
      dependencies: ['collection'],
      fulfill: {
        state: {
          visible: '{{!!$deps[0]}}',
        },
      },
    },
  ],
};
