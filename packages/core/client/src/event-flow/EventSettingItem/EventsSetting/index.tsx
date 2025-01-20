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
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { InputNumber, SchemaComponent, useProps } from '../../../schema-component';
import { ArrayCollapse } from './components/LinkageHeader';
import { FormProvider, createSchemaField } from '@formily/react';
import { ActionsSetting } from '../ActionsSetting';
import EventSelect from './EventSelect';
export interface Props {
  dynamicComponent: any;
}

export const EventsSetting = withDynamicSchemaProps(
  observer((props: Props) => {
    const components = useMemo(() => ({ ArrayCollapse, ActionsSetting, EventSelect }), []);
    const { definitions } = useProps(props);

    const schema = useMemo(
      () => ({
        type: 'object',
        properties: {
          events: {
            type: 'array',
            // default: defaultValues,
            'x-component': 'ArrayCollapse',
            'x-decorator': 'FormItem',
            'x-component-props': {
              accordion: true,
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
                      marginTop: '4px',
                    },
                    labelCol: 8,
                    wrapperCol: 16,
                  },
                  properties: {
                    eventTitle: {
                      'x-component': 'h4',
                      'x-content': '{{ t("触发事件") }}',
                    },
                    event: {
                      'x-component': EventSelect,
                      'x-component-props': {
                        definitions,
                        className: css`
                          margin-bottom: 12px;
                        `,
                      },
                    },
                    actionTitle: {
                      'x-component': 'h4',
                      'x-content': '{{ t("执行动作") }}',
                    },
                    actions: {
                      type: 'void',
                      'x-component': ActionsSetting,
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
                // moveUp: {
                //   type: 'void',
                //   'x-component': 'ArrayCollapse.MoveUp',
                // },
                // moveDown: {
                //   type: 'void',
                //   'x-component': 'ArrayCollapse.MoveDown',
                // },
                // copy: {
                //   type: 'void',
                //   'x-component': 'ArrayCollapse.Copy',
                // },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: '{{ t("Add events") }}',
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
      [],
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
  { displayName: 'Evets' },
);
