/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { observer, useField, useFieldSchema, useForm } from '@formily/react';
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
import { ArrayBase, Select, DatePicker, Editable, Input, ArrayItems, FormItem } from '@formily/antd-v5';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { EventDefinition, EventSetting } from '../../types';
import { useVariableOptions } from '../hooks/useVariableOptions';
import { uniqBy } from 'lodash';
import { AddBtn, DeleteBtn } from './AddBtn';
import { ActionSelect } from '../components/ActionSelect';
import { ActionParamSelect } from '../components/ActionParamSelect';
import { Space } from 'antd';
import { useFormBlockContext } from '../../../block-provider';
import ConditionSelect from '../components/ConditionSelect';
import { actionsSchema } from '../schemas/actions';

const SchemaField = createSchemaField({
  components: {
    FormItem,
    DatePicker,
    Editable,
    Space, // 使用antd包内的Space组件，包含Compact
    Compact: Space.Compact,
    Input,
    Select,
    ArrayItems,
    ArrayCollapse,
    Filter,
    ActionSelect,
    ActionParamSelect,
    ConditionSelect,
  },
  scope: {
    emptyParams(field, target) {
      const params = field.query('.params').take(1);
      params.value = [];
    },
  },
});
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
    const { options, defaultValues, collectionName, variables, localVariables, record, dynamicComponent } = props;
    const { getAllCollectionsInheritChain } = useCollectionManager_deprecated();
    const parentRecordData = useCollectionParentRecordData();
    const { form } = useFormBlockContext();
    const variableOptions = useVariableOptions();
    console.log('variableOptions', variableOptions);
    const components = useMemo(
      () => ({
        ArrayCollapse,
        Filter,
        Space,
        ActionParamSelect,
        ActionSelect,
        ConditionSelect,
      }),
      [],
    );

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
                      'x-component': 'ConditionSelect',
                      'x-reactions': {
                        dependencies: ['...event'],
                        fulfill: {
                          state: {
                            'componentProps.options3': '{{$deps[0]}}',
                          },
                        },
                      },
                    },
                    actionsTitle: {
                      'x-component': 'h4',
                      'x-content': '{{ t("动作") }}',
                    },
                    actionsBlock: actionsSchema,
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
                title: '{{ t("添加规则") }}',
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
      <SchemaComponent
        components={components}
        schema={schema}
        scope={{
          emptyParams: (field, target) => {
            const params = field.query('.params').take(1);
            params.value = [];
          },
        }}
      />
    );

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
