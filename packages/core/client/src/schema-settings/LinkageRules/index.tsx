import { css } from '@emotion/css';
import { observer, useFieldSchema } from '@formily/react';
import React from 'react';
import { SchemaComponent } from '../../schema-component';
import { FilterContext } from '../../schema-component/antd/filter/context';
import { FilterDynamicComponent } from './FilterDynamicComponent';
import { LinkageRuleActionGroup } from './LinkageRuleActionGroup';

export const FormLinkageRules = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  const { useProps, dynamicComponent } = props;
  const { options, defaultValues, collectionName } = useProps();
  return (
    <FilterContext.Provider value={{ field: options, fieldSchema, dynamicComponent, options: options || [] }}>
      <SchemaComponent
        schema={{
          type: 'object',
          properties: {
            rules: {
              type: 'array',
              default: defaultValues,
              'x-component': 'ArrayCollapse',
              'x-decorator': 'FormItem',
              'x-component-props': {
                accordion: true,
              },
              items: {
                type: 'object',
                'x-component': 'ArrayCollapse.CollapsePanel',
                'x-component-props': {
                  header: '{{ t("Linkage rule") }}',
                },
                properties: {
                  index: {
                    type: 'void',
                    'x-component': 'ArrayCollapse.Index',
                  },
                  layout: {
                    type: 'void',
                    'x-component': 'FormLayout',
                    'x-component-props': {
                      labelStyle: {
                        marginTop: '6px',
                      },
                      labelCol: 8,
                      wrapperCol: 16,
                    },
                    properties: {
                      conditions: {
                        'x-component': 'h4',
                        'x-content': '{{ t("Condition") }}',
                      },
                      condition: {
                        'x-component': 'Filter',
                        'x-component-props': {
                          useProps() {
                            return {
                              options,
                              className: css`
                                position: relative;
                                width: 100%;
                                margin-left: 10px;
                              `,
                            };
                          },
                          dynamicComponent: (props) => FilterDynamicComponent({ ...props, collectionName }),
                        },
                      },
                      actions: {
                        'x-component': 'h4',
                        'x-content': '{{ t("Properties") }}',
                      },
                      action: {
                        type: 'void',
                        'x-component': LinkageRuleActionGroup,
                        'x-component-props': {
                          ...props,
                        },
                      },
                    },
                  },
                  remove: {
                    type: 'void',
                    'x-component': 'ArrayCollapse.Remove',
                  },
                  moveUp: {
                    type: 'void',
                    'x-component': 'ArrayCollapse.MoveUp',
                  },
                  moveDown: {
                    type: 'void',
                    'x-component': 'ArrayCollapse.MoveDown',
                  },
                },
              },
              properties: {
                add: {
                  type: 'void',
                  title: '{{ t("Add linkage rule") }}',
                  'x-component': 'ArrayCollapse.Addition',
                  'x-reactions': {
                    dependencies: ['rules'],
                    fulfill: {
                      state: {
                        // disabled: '{{$deps[0].length >= 3}}',
                      },
                    },
                  },
                },
              },
            },
          },
        }}
      />
    </FilterContext.Provider>
  );
});
