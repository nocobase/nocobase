import { css } from '@emotion/css';
import { useCollection } from '@nocobase/client';
import { useFields } from './useFields';

export const useShared = () => {
  const { name } = useCollection();
  const fields = useFields(name);
  return {
    importSettingsSchema: {
      type: 'void',
      'x-component': 'Grid',
      properties: {
        explain: {
          type: 'string',
          title: '{{t("Import explain")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
        importSettings: {
          type: 'array',
          'x-component': 'ArrayItems',
          'x-decorator': 'FormItem',
          items: {
            type: 'object',
            properties: {
              space: {
                type: 'void',
                'x-component': 'Space',
                'x-component-props': {
                  className: css`
                    width: 100%;
                    & .ant-space-item:nth-child(2) {
                      flex: 1;
                    }
                  `,
                },
                properties: {
                  sort: {
                    type: 'void',
                    'x-decorator': 'FormItem',
                    'x-component': 'ArrayItems.SortHandle',
                  },
                  dataIndex: {
                    type: 'array',
                    'x-decorator': 'FormItem',
                    'x-component': 'Cascader',
                    required: true,
                    enum: fields,
                    'x-component-props': {
                      fieldNames: {
                        label: 'title',
                        value: 'name',
                        children: 'children',
                      },
                      // labelInValue: true,
                      changeOnSelect: false,
                    },
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
              title: '{{ t("Add importable field") }}',
              'x-component': 'ArrayItems.Addition',
              'x-component-props': {
                className: css`
                  border-color: rgb(241, 139, 98);
                  color: rgb(241, 139, 98);
                  &.ant-btn-dashed:hover {
                    border-color: rgb(241, 139, 98);
                    color: rgb(241, 139, 98);
                  }
                `,
              },
            },
          },
        },
      },
    },
    importSchema: {
      type: 'void',
      'x-component': 'Grid',
      properties: {},
    },
  };
};
