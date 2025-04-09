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
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../collection-manager';
import { useCollectionParentRecordData } from '../../data-source/collection-record/CollectionRecordProvider';
import { CollectionProvider } from '../../data-source/collection/CollectionProvider';
import { withDynamicSchemaProps } from '../../hoc/withDynamicSchemaProps';
import { RecordProvider } from '../../record-provider';
import { SchemaComponent, useProps } from '../../schema-component';
import { SubFormProvider } from '../../schema-component/antd/association-field/hooks';
import { DynamicComponentProps } from '../../schema-component/antd/filter/DynamicComponent';
import { FilterContext } from '../../schema-component/antd/filter/context';
import { VariableInput, getShouldChange } from '../VariableInput/VariableInput';
import { LinkageRuleActionGroup } from './LinkageRuleActionGroup';
import { EnableLinkage } from './components/EnableLinkage';
import { ArrayCollapse } from './components/LinkageHeader';

export interface Props {
  dynamicComponent: any;
}

type Condition = { [field: string]: { [op: string]: any } } | { $and: Condition[] } | { $or: Condition[] };
type TransformedCondition =
  | { leftVar: string; op: string; rightVar: any }
  | { $and: TransformedCondition[] }
  | { $or: TransformedCondition[] };
function transformConditionData(condition: Condition, variableKey: '$nForm' | '$nRecord'): TransformedCondition {
  if ('$and' in condition) {
    return {
      $and: condition.$and.map((c) => transformConditionData(c, variableKey)),
    };
  }

  if ('$or' in condition) {
    return {
      $or: condition.$or.map((c) => transformConditionData(c, variableKey)),
    };
  }

  const [field, expression] = Object.entries(condition)[0];
  const [op, value] = Object.entries(expression)[0];

  return {
    leftVar: `{{${variableKey}.${field}}}`,
    op,
    rightVar: value,
  };
}
function getActiveContextName(contextList: { name: string; ctx: any }[]): string | null {
  const priority = ['$nForm', '$nRecord'];
  for (const name of priority) {
    const item = contextList.find((ctx) => ctx.name === name && ctx.ctx);
    if (item) return name;
  }
  return '$nRecord';
}

const transformDefaultValue = (values, variableKey) => {
  return values.map((v) => {
    if (v.conditionType !== 'advanced') {
      const condition = transformConditionData(v.condition, variableKey);
      return {
        ...v,
        condition: variableKey ? condition : v.condition,
        conditionType: variableKey ? 'advanced' : 'basic',
      };
    }
    return v;
  });
};

export const FormLinkageRules = withDynamicSchemaProps(
  observer((props: Props) => {
    const fieldSchema = useFieldSchema();
    const { options, defaultValues, collectionName, form, variables, localVariables, record, dynamicComponent } =
      useProps(props); // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
    const { name } = useCollection_deprecated();
    const { getAllCollectionsInheritChain } = useCollectionManager_deprecated();
    const parentRecordData = useCollectionParentRecordData();
    const variableKey = getActiveContextName(localVariables);
    console.log(localVariables);
    const components = useMemo(() => ({ ArrayCollapse }), []);
    const schema = useMemo(
      () => ({
        type: 'object',
        properties: {
          rules: {
            type: 'array',
            default: transformDefaultValue(defaultValues, variableKey),
            'x-component': 'ArrayCollapse',
            'x-decorator': 'FormItem',
            'x-component-props': {
              accordion: true,
            },
            items: {
              type: 'object',
              'x-component': 'ArrayCollapse.CollapsePanel',
              'x-component-props': {
                extra: <EnableLinkage />,
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
                    conditions: {
                      'x-component': 'h4',
                      'x-content': '{{ t("Condition") }}',
                    },
                    condition: {
                      'x-component': 'Input', // 仅作为数据存储
                      'x-hidden': true, // 不显示
                      'x-reactions': [
                        {
                          dependencies: ['.conditionType', '.conditionBasic', '.conditionAdvanced'],
                          fulfill: {
                            state: {
                              value: '{{$deps[0] === "basic" ? $deps[1] : $deps[2]}}',
                            },
                          },
                        },
                      ],
                    },
                    conditionBasic: {
                      'x-component': 'Filter',
                      'x-use-component-props': () => {
                        return {
                          options,
                          className: css`
                            position: relative;
                            width: 100%;
                            margin-left: 10px;
                          `,
                        };
                      },
                      'x-visible': '{{$deps[0] === "basic"}}',
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
                            />
                          );
                        },
                      },
                      'x-reactions': [
                        {
                          dependencies: ['.conditionType', '.condition'],
                          fulfill: {
                            state: {
                              visible: '{{$deps[0] === "basic"}}',
                              value: '{{$deps[0] === "basic" ? $deps[1] : undefined}}',
                            },
                          },
                        },
                      ],
                    },
                    conditionAdvanced: {
                      'x-component': 'LinkageFilter',
                      'x-visible': '{{$deps[0] === "advanced"}}',
                      'x-reactions': [
                        {
                          dependencies: ['.conditionType', '.condition'],
                          fulfill: {
                            state: {
                              visible: '{{$deps[0] === "advanced"}}',
                              value: '{{$deps[0] === "advanced" ? $deps[1] : undefined}}',
                            },
                          },
                        },
                      ],
                    },
                    conditionType: {
                      type: 'string',
                      'x-component': 'Input',
                      default: 'advanced',
                      'x-hidden': true,
                    },
                    actions: {
                      'x-component': 'h4',
                      'x-content': '{{ t("Properties") }}',
                    },
                    action: {
                      type: 'void',
                      'x-component': (_props) => <LinkageRuleActionGroup {..._props} {...props} />,
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
                copy: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.Copy',
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
      ],
    );
    const value = useMemo(
      () => ({ field: options, fieldSchema, dynamicComponent, options: options || [] }),
      [dynamicComponent, fieldSchema, options],
    );

    return (
      // 这里使用 SubFormProvider 包裹，是为了让子表格的联动规则中 “当前对象” 的配置显示正确
      <SubFormProvider value={{ value: null, collection: { name: collectionName || name } as any }}>
        <RecordProvider record={record} parent={parentRecordData}>
          <FilterContext.Provider value={value}>
            <CollectionProvider name={collectionName || name}>
              <SchemaComponent components={components} schema={schema} />
            </CollectionProvider>
          </FilterContext.Provider>
        </RecordProvider>
      </SubFormProvider>
    );
  }),
  { displayName: 'FormLinkageRules' },
);
