import React from 'react';
import { css } from '@emotion/css';
import { i18n } from '../../i18n';
import { ISchema, observer, useForm, useFieldSchema } from '@formily/react';
import { useCollection, useCollectionManager, useCollectionFilterOptions } from '../../collection-manager';
import { SchemaComponent, SchemaComponentOptions } from '../../schema-component';
import { FilterContext } from '../../schema-component/antd/filter/context';
import { LinkageRuleActionGroup } from './LinkageRuleActionGroup';

export const FormLinkageRules = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  const { getCollectionFields, getCollection, getInterface, getCollectionJoinField } = useCollectionManager();
  //   const validateSchema = interfaceConfig?.['validateSchema']?.(fieldSchema);
  const { useProps, dynamicComponent } = props;
  const { options,defaultValues } = useProps();
  return (
    <FilterContext.Provider value={{ field: options, fieldSchema, dynamicComponent, options: options || [] }}>
      <SchemaComponent
        schema={{
          type: 'object',
          properties: {
            rules: {
              type: 'array',
              default:defaultValues,
              'x-component': 'ArrayCollapse',
              'x-decorator': 'FormItem',
              'x-component-props': {
                accordion: true,
              },
              maxItems: 3,
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
                      // ...validateSchema,
                      // message: {
                      //   type: 'string',
                      //   title: '{{ t("Error message") }}',
                      //   'x-decorator': 'FormItem',
                      //   'x-component': 'Input.TextArea',
                      //   'x-component-props': {
                      //     autoSize: {
                      //       minRows: 2,
                      //       maxRows: 2,
                      //     },
                      //   },
                      // },
                      condition: {
                        'x-component': 'h2',
                        'x-content': '条件',
                      },
                      linkageRuleCondition: {
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
                          // dynamicComponent: FilterDynamicComponent,
                        },
                      },
                      action: {
                        'x-component': 'h2',
                        'x-content': '操作',
                      },
                      linkageRuleAction: {
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
