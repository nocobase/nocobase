/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { observer, useFieldSchema } from '@formily/react';
import React, { useMemo } from 'react';
import { useCollectionManager_deprecated } from '../../../collection-manager';
import { useCollectionParentRecordData } from '../../../data-source/collection-record/CollectionRecordProvider';
import { CollectionProvider } from '../../../data-source/collection/CollectionProvider';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { RecordProvider } from '../../../record-provider';
import { SchemaComponent, useProps } from '../../../schema-component';
import { SubFormProvider } from '../../../schema-component/antd/association-field/hooks';
import { DynamicComponentProps } from '../../../schema-component/antd/filter/DynamicComponent';
import { FilterContext } from '../../../schema-component/antd/filter/context';
import { VariableInput, getShouldChange } from '../../../schema-settings/VariableInput/VariableInput';
import { ActionsField } from './Actions';
import { FormProvider, createSchemaField } from '@formily/react';
import { ArrayCollapse } from '../components/LinkageHeader';
import { Filter } from '../Filter';
import { ArrayBase } from '@formily/antd-v5';
import { useFilterOptions } from './hooks/useFilterOptions';
import { EventDefinition, EventSetting } from '../../types';
import { useVariableOptions } from './hooks/useVariableOptions';
import { uniqBy } from 'lodash';
import { AddBtn, DeleteBtn } from './AddBtn';
import { ActionSelect } from './ActionSelect';
import { ActionParamSelect } from './ActionParamSelect';

export interface Props {
  dynamicComponent: any;
  definitions: EventDefinition[];
}

export const ActionsSetting = withDynamicSchemaProps(
  observer((props: Props) => {
    const fieldSchema = useFieldSchema();
    const array = ArrayBase.useArray();
    const recordValues = ArrayBase.useRecord();
    const index = ArrayBase.useIndex();
    const {
      definitions,
      options,
      defaultValues,
      collectionName,
      form,
      variables,
      localVariables,
      record,
      dynamicComponent,
    } = props;
    const { getAllCollectionsInheritChain } = useCollectionManager_deprecated();
    const parentRecordData = useCollectionParentRecordData();

    const filterOptions = useFilterOptions(recordValues);
    const variableOptions = useVariableOptions();
    console.log('variableOptions', variableOptions);

    const components = useMemo(() => ({ ArrayCollapse, Filter }), []);
    const schema = useMemo(
      () => ({
        type: 'object',
        properties: {
          rules: {
            type: 'array',
            // default: defaultValues,
            'x-component': 'ArrayCollapse',
            'x-decorator': 'FormItem',
            'x-component-props': {
              accordion: true,
              titleRender: (item: any, index: number) => {
                return `动作 ${index + 1}`;
              },
              showEmpty: false,
            },
            items: {
              type: 'object',
              'x-component': 'ArrayCollapse.CollapsePanel',
              'x-component-props': {
                // extra: <EnableLinkage />,
              },
              properties: {
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
                    conditionsTitle: {
                      'x-component': 'h4',
                      'x-content': '{{ t("Condition") }}',
                    },
                    condition: {
                      'x-component': 'Filter',
                      'x-use-component-props': () => {
                        return {
                          options: filterOptions,
                          className: css`
                            position: relative;
                            width: 100%;
                            margin-left: 10px;
                          `,
                        };
                      },
                      'x-component-props': {
                        collectionName,
                        dynamicComponent: (props: DynamicComponentProps) => {
                          const { collectionField } = props;
                          return (
                            <VariableInput
                              {...props}
                              form={form}
                              record={record}
                              shouldChange={getShouldChange({
                                collectionField,
                                variables,
                                localVariables,
                                getAllCollectionsInheritChain,
                              })}
                              returnScope={(scope) => {
                                return uniqBy([...scope, ...variableOptions], 'key');
                              }}
                            />
                          );
                        },
                      },
                    },
                    actionsTitle: {
                      'x-component': 'h4',
                      'x-content': '{{ t("动作") }}',
                    },
                    actionsBlock: {
                      type: 'void',
                      properties: {
                        actions: {
                          type: 'array',
                          'x-component': 'ArrayItems',
                          items: {
                            type: 'object',
                            'x-component': 'Space',
                            properties: {
                              action: {
                                type: 'string',
                                'x-component': ActionSelect,
                              },

                              params: {
                                type: 'array',
                                'x-component': 'ArrayItems',
                                items: {
                                  type: 'object',
                                  'x-component': 'Space',
                                  'x-component-props': {
                                    direction: 'vertical',
                                    style: {
                                      marginBottom: '10px',
                                    },
                                  },
                                  properties: {
                                    key: {
                                      type: 'string',
                                      'x-component': ActionParamSelect,
                                      'x-reactions': {
                                        dependencies: ['...action'],
                                        fulfill: {
                                          schema: {
                                            'x-component-props': {
                                              action: '{{$deps[0]}}',
                                            },
                                          },
                                        },
                                      },
                                    },
                                    value: {
                                      type: 'string',
                                      'x-component': 'Input',
                                      'x-reactions': {
                                        dependencies: ['...action'],
                                        fulfill: {
                                          schema: {
                                            'x-component-props': {
                                              action: '{{$deps[0]}}',
                                            },
                                          },
                                        },
                                      },
                                    },
                                    delete: {
                                      type: 'void',
                                      'x-component': DeleteBtn,
                                    },
                                  },
                                },
                              },
                              add: {
                                type: 'void',
                                'x-component': AddBtn,
                                'x-component-props': {
                                  addKey: '.params',
                                  text: '{{ t("添加参数") }}',
                                },
                              },
                            },
                          },
                        },
                        add: {
                          type: 'void',
                          'x-component': AddBtn,
                          'x-component-props': {
                            addKey: '.actions',
                            text: '{{ t("添加动作") }}',
                          },
                        },
                      },
                      // 'x-component': ActionsField,
                    },
                  },
                },
                remove: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.Remove',
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: '{{ t("Add actions") }}',
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
      }),
      [
        collectionName,
        defaultValues,
        form,
        getAllCollectionsInheritChain,
        localVariables,
        options,
        props,
        record,
        variables,
        filterOptions,
      ],
    );
    const value = useMemo(
      () => ({ field: options, fieldSchema, dynamicComponent, options: options || [] }),
      [dynamicComponent, fieldSchema, options],
    );

    return <SchemaComponent components={components} schema={schema} />;

    // return (
    //   // 这里使用 SubFormProvider 包裹，是为了让子表格的联动规则中 “当前对象” 的配置显示正确
    //   // <FormProvider form={form}>
    //   <SubFormProvider value={{ value: null, collection: { name: collectionName } as any }}>
    //     <RecordProvider record={record} parent={parentRecordData}>
    //       <FilterContext.Provider value={value}>
    //         <CollectionProvider name={collectionName}>
    //           <SchemaComponent components={components} schema={schema} />
    //         </CollectionProvider>
    //       </FilterContext.Provider>
    //     </RecordProvider>
    //   </SubFormProvider>
    //   // </FormProvider>
    // );
  }),
  { displayName: 'ActionsSetting' },
);
