import { css } from '@emotion/css';
import { Form } from '@formily/core';
import { observer, useFieldSchema } from '@formily/react';
import React, { useMemo } from 'react';
import { FormBlockContext } from '../../block-provider';
import { useCollectionManager_deprecated } from '../../collection-manager';
import { useCollectionParentRecordData } from '../../data-source/collection-record/CollectionRecordProvider';
import { RecordProvider } from '../../record-provider';
import { SchemaComponent } from '../../schema-component';
import { DynamicComponentProps } from '../../schema-component/antd/filter/DynamicComponent';
import { FilterContext } from '../../schema-component/antd/filter/context';
import { VariableOption, VariablesContextType } from '../../variables/types';
import { VariableInput, getShouldChange } from '../VariableInput/VariableInput';
import { LinkageRuleActionGroup } from './LinkageRuleActionGroup';
import { EnableLinkage } from './components/EnableLinkage';
import { ArrayCollapse } from './components/LinkageHeader';

interface usePropsReturn {
  options: any;
  defaultValues: any[];
  collectionName: string;
  form: Form;
  variables: VariablesContextType;
  localVariables: VariableOption | VariableOption[];
  record: Record<string, any>;
  /**
   * create 表示创建表单，update 表示更新表单
   */
  formBlockType: 'create' | 'update';
}

interface Props {
  useProps: () => usePropsReturn;
  dynamicComponent: any;
}

export const FormLinkageRules = observer(
  (props: Props) => {
    const fieldSchema = useFieldSchema();
    const { useProps, dynamicComponent } = props;
    const { options, defaultValues, collectionName, form, formBlockType, variables, localVariables, record } =
      useProps();
    const { getAllCollectionsInheritChain } = useCollectionManager_deprecated();
    const parentRecordData = useCollectionParentRecordData();

    const components = useMemo(() => ({ ArrayCollapse }), []);
    const schema = useMemo(
      () => ({
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
                      'x-component': 'Filter',
                      'x-component-props': {
                        collectionName,
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
      [collectionName, defaultValues, form, localVariables, options, props, record, variables],
    );
    const value = useMemo(
      () => ({ field: options, fieldSchema, dynamicComponent, options: options || [] }),
      [dynamicComponent, fieldSchema, options],
    );

    return (
      <FormBlockContext.Provider value={{ form, type: formBlockType, collectionName }}>
        <RecordProvider record={record} parent={parentRecordData}>
          <FilterContext.Provider value={value}>
            <SchemaComponent components={components} schema={schema} />
          </FilterContext.Provider>
        </RecordProvider>
      </FormBlockContext.Provider>
    );
  },
  { displayName: 'FormLinkageRules' },
);
