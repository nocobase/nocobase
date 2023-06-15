import { ISchema } from '@formily/react';
import { lang } from '../../locale';
import { uid } from '@formily/shared';

const getArraySchema = (fields = {}, extra = {}) => ({
  type: 'array',
  'x-decorator': 'FormItem',
  'x-component': 'ArrayItems',
  ...extra,
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
          ...fields,
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
      title: '{{t("Add field")}}',
      'x-component': 'ArrayItems.Addition',
    },
  },
});

export const getConfigSchema = (general: any) => ({
  type: 'void',
  properties: {
    config: {
      type: 'object',
      properties: {
        chartType: {
          type: 'string',
          title: '{{t("Chart type")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-component-props': {
            placeholder: '{{t("Please select a chart type.")}}',
          },
          enum: '{{ chartTypes }}',
        },
        [uid()]: {
          type: 'void',
          properties: {
            general,
          },
        },
        [uid()]: {
          type: 'void',
          properties: {
            advanced: {
              type: 'json',
              title: '{{t("JSON config")}}',
              'x-decorator': 'FormItem',
              'x-decorator-props': {
                extra: lang('Same properties set in the form above will be overwritten by this JSON config.'),
              },
              'x-component': 'Input.JSON',
              'x-component-props': {
                autoSize: {
                  minRows: 5,
                },
              },
            },
          },
        },
      },
    },
  },
});

export const querySchema: ISchema = {
  type: 'void',
  properties: {
    settings: {
      type: 'void',
      'x-component': 'FormItem',
      properties: {
        // mode: {
        //   type: 'string',
        //   'x-decorator': 'FormItem',
        //   'x-decorator-props': {
        //     style: {
        //       display: 'inline-block',
        //       width: '45%',
        //     },
        //   },
        //   'x-component': 'Radio.Group',
        //   'x-component-props': {
        //     defaultValue: 'builder',
        //     optionType: 'button',
        //     buttonStyle: 'solid',
        //   },
        //   enum: [
        //     {
        //       label: lang('Builder mode'),
        //       value: 'builder',
        //     },
        //     {
        //       label: lang('SQL mode'),
        //       value: 'sql',
        //     },
        //   ],
        //   'x-reactions': [
        //     {
        //       target: 'query.builder',
        //       fulfill: {
        //         state: {
        //           visible: '{{ $self.value !== "sql" }}',
        //         },
        //       },
        //     },
        //     {
        //       target: 'query.sql',
        //       fulfill: {
        //         state: {
        //           visible: '{{ $self.value === "sql" }}',
        //         },
        //       },
        //     },
        //   ],
        // },
        collection: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-decorator-props': {
            style: {
              display: 'inline-block',
              width: '30%',
            },
          },
          'x-component': 'Select',
          'x-component-props': {
            options: '{{ collectionOptions }}',
            onChange: '{{ onCollectionChange }}',
            placeholder: lang('Collection'),
          },
        },
      },
    },
    query: {
      type: 'object',
      properties: {
        builder: {
          type: 'void',
          properties: {
            collapse: {
              type: 'void',
              'x-decorator': 'FormItem',
              'x-component': 'FormCollapse',
              'x-component-props': {
                formCollapse: '{{formCollapse}}',
              },
              properties: {
                pane1: {
                  type: 'void',
                  'x-component': 'FormCollapse.CollapsePanel',
                  'x-component-props': {
                    header: lang('Measures'),
                    key: 'measures',
                  },
                  properties: {
                    measures: getArraySchema({
                      field: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Select',
                        'x-component-props': {
                          placeholder: '{{t("Field")}}',
                        },
                        enum: '{{ fields }}',
                      },
                      aggregation: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Select',
                        'x-component-props': {
                          placeholder: '{{t("Aggregation")}}',
                        },
                        enum: [
                          { label: lang('Sum'), value: 'sum' },
                          { label: lang('Count'), value: 'count' },
                          { label: lang('Avg'), value: 'avg' },
                          { label: lang('Max'), value: 'max' },
                          { label: lang('Min'), value: 'min' },
                        ],
                      },
                      alias: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                        'x-component-props': {
                          placeholder: '{{t("Alias")}}',
                        },
                      },
                    }),
                  },
                },
                pane2: {
                  type: 'void',
                  'x-component': 'FormCollapse.CollapsePanel',
                  'x-component-props': {
                    header: lang('Dimensions'),
                    key: 'dimensions',
                  },
                  properties: {
                    dimensions: getArraySchema({
                      field: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Select',
                        'x-component-props': {
                          placeholder: '{{t("Field")}}',
                        },
                        enum: '{{ fields }}',
                      },
                      format: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Select',
                        'x-component-props': {
                          placeholder: '{{t("Format")}}',
                          style: {
                            maxWidth: '120px',
                          },
                        },
                        'x-reactions': '{{ useFormatterOptions }}',
                        'x-visible': '{{ $self.dataSource && $self.dataSource.length }}',
                      },
                      alias: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                        'x-component-props': {
                          placeholder: '{{t("Alias")}}',
                        },
                      },
                    }),
                  },
                },
                pane3: {
                  type: 'void',
                  'x-component': 'FormCollapse.CollapsePanel',
                  'x-component-props': {
                    header: lang('Filter'),
                    key: 'filter',
                  },
                  properties: {
                    filter: {
                      type: 'object',
                      'x-decorator': 'FormItem',
                      'x-component': 'Filter',
                      'x-component-props': {
                        options: '{{ filterOptions }}',
                        // dynamicComponent: 'Input',
                      },
                    },
                  },
                },
                pane4: {
                  type: 'void',
                  'x-component': 'FormCollapse.CollapsePanel',
                  'x-component-props': {
                    header: lang('Sort'),
                    key: 'sort',
                  },
                  properties: {
                    orders: getArraySchema({
                      field: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Select',
                        'x-component-props': {
                          options: '{{ fields }}',
                          placeholder: '{{t("Field")}}',
                        },
                      },
                      order: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Radio.Group',
                        'x-component-props': {
                          defaultValue: 'ASC',
                          optionType: 'button',
                        },
                        enum: ['ASC', 'DESC'],
                      },
                    }),
                  },
                },
              },
            },
            limit: {
              title: 'Limit',
              type: 'number',
              'x-decorator': 'FormItem',
              'x-component': 'InputNumber',
              'x-component-props': {
                defaultValue: 2000,
                max: 2000,
                min: 1,
                style: {
                  width: '100px',
                },
              },
            },
          },
        },
        // sql: {
        //   type: 'object',
        //   properties: {
        //     select: {
        //       type: 'void',
        //       'x-decorator': 'p',
        //       'x-component': 'Text',
        //       'x-component-props': {
        //         code: true,
        //       },
        //       'x-content': 'SELECT',
        //     },
        //     fields: {
        //       type: 'string',
        //       'x-decorator': 'FormItem',
        //       'x-component': 'Input.TextArea',
        //       'x-component-props': {
        //         autoSize: {
        //           minRows: 2,
        //         },
        //         placeholder: 'Fields',
        //       },
        //       required: true,
        //     },
        //     from: {
        //       type: 'void',
        //       'x-decorator': 'p',
        //       'x-component': 'FromSql',
        //     },
        //     clauses: {
        //       type: 'string',
        //       'x-decorator': 'FormItem',
        //       'x-component': 'Input.TextArea',
        //       'x-component-props': {
        //         autoSize: {
        //           minRows: 5,
        //         },
        //         placeholder: 'Join, Where, Group By, Having, Order By, Limit',
        //       },
        //       required: true,
        //     },
        //   },
        // },
        cache: {
          type: 'object',
          properties: {
            enabled: {
              type: 'boolean',
              title: '{{t("Enable cache")}}',
              'x-decorator': 'FormItem',
              'x-component': 'Switch',
            },
            ttl: {
              type: 'number',
              title: '{{t("TTL (second)")}}',
              'x-decorator': 'FormItem',
              'x-component': 'InputNumber',
              'x-component-props': {
                defaultValue: 60,
                min: 1,
                style: {
                  width: '100px',
                },
              },
            },
          },
        },
      },
    },
  },
};

export const transformSchema: ISchema = {
  type: 'void',
  properties: {
    transform: getArraySchema(
      {
        field: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-component-props': {
            placeholder: '{{t("Field")}}',
            style: {
              maxWidth: '100px',
            },
          },
          'x-reactions': '{{ useChartFields }}',
        },
        type: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-component-props': {
            placeholder: '{{t("Type")}}',
          },
          'x-reactions': '{{ useFieldTypeOptions }}',
        },
        format: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-component-props': {
            placeholder: '{{t("Format")}}',
          },
          'x-reactions': '{{ useTransformers }}',
          'x-visible': '{{ $self.dataSource && $self.dataSource.length }}',
        },
      },
      {
        'x-decorator-props': {
          style: {
            width: '50%',
          },
        },
      },
    ),
  },
};
