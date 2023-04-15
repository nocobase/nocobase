import { Schema, observer } from '@formily/react';
import { TreeSelect } from 'antd';
import React, { useMemo } from 'react';
import { AssociationSelect, SchemaComponent } from '../../schema-component';
import { AsDefaultTemplate } from './components/AsDefaultTemplate';
import { ArrayCollapse } from './components/DataTemplateTitle';
import { useCollectionState } from './hooks/useCollectionState';

export const FormDataTemplates = observer((props: any) => {
  const { useProps } = props;
  const { defaultValues, collectionName } = useProps();
  const { collectionList, getEnableFieldTree } = useCollectionState(collectionName);

  const components = useMemo(() => ({ ArrayCollapse }), []);
  const schema = useMemo(
    (): Schema => ({
      type: 'object',
      properties: {
        templates: {
          type: 'array',
          default: defaultValues?.templates,
          'x-component': 'ArrayCollapse',
          'x-decorator': 'FormItem',
          'x-component-props': {
            accordion: true,
          },
          items: {
            type: 'object',
            'x-component': 'ArrayCollapse.CollapsePanel',
            'x-component-props': {
              extra: [<AsDefaultTemplate />],
            },
            properties: {
              layout: {
                type: 'void',
                'x-component': 'FormLayout',
                'x-component-props': {
                  layout: 'vertical',
                },
                // TODO: 翻译
                properties: {
                  // @ts-ignore
                  collection: {
                    type: 'string',
                    title: '{{ t("Collection") }}',
                    required: true,
                    description: '当前表有继承关系时，可选择继承链路上的表作为模板来源',
                    default: collectionName,
                    'x-display': collectionList.length > 1 ? 'visible' : 'hidden',
                    'x-decorator': 'FormItem',
                    'x-component': 'Select',
                    'x-component-props': {
                      options: collectionList,
                    },
                  },
                  // @ts-ignore
                  dataId: {
                    type: 'number',
                    title: '{{ t("Template Data") }}',
                    required: true,
                    description: '选择一条已有的数据作为表单的初始化数据',
                    'x-decorator': 'FormItem',
                    'x-component': AssociationSelect,
                    'x-component-props': {
                      service: {
                        resource: collectionName,
                      },
                      action: 'list',
                      multiple: false,
                      objectValue: false,
                      manual: false,
                      mapOptions: (item) => {
                        // TODO: 应该使用 item.title 字段的值作为 label
                        return {
                          label: `#${item.id} 表名`,
                          value: item.id,
                        };
                      },
                      fieldNames: {
                        label: 'label',
                        value: 'value',
                      },
                    },
                    'x-reactions': [
                      {
                        dependencies: ['.collection'],
                        fulfill: {
                          state: {
                            disabled: '{{ !$deps[0] }}',
                            componentProps: {
                              service: {
                                resource: '{{ $deps[0] }}',
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                  // @ts-ignore
                  fields: {
                    type: 'array',
                    title: '{{ t("Data fields") }}',
                    required: true,
                    description: '仅选择的字段才会作为表单的初始化数据',
                    'x-decorator': 'FormItem',
                    'x-component': 'TreeSelect',
                    'x-component-props': {
                      treeData: [],
                      treeCheckable: true,
                      showCheckedStrategy: TreeSelect.SHOW_PARENT,
                    },
                    'x-reactions': [
                      {
                        dependencies: ['.collection'],
                        fulfill: {
                          state: {
                            disabled: '{{ !$deps[0] }}',
                            componentProps: {
                              treeData: '{{ getEnableFieldTree($deps[0]) }}',
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
              // @ts-ignore
              remove: {
                type: 'void',
                'x-component': 'ArrayCollapse.Remove',
              },
              // @ts-ignore
              moveUp: {
                type: 'void',
                'x-component': 'ArrayCollapse.MoveUp',
              },
              // @ts-ignore
              moveDown: {
                type: 'void',
                'x-component': 'ArrayCollapse.MoveDown',
              },
            },
          },
          properties: {
            // @ts-ignore
            add: {
              type: 'void',
              title: '{{ t("Add a template") }}',
              'x-component': 'ArrayCollapse.Addition',
            },
          },
        },
        // @ts-ignore
        checkbox: {
          type: 'void',
          'x-component': 'FormLayout',
          properties: {
            // @ts-ignore
            display: {
              type: 'boolean',
              title: '{{ t("Display data template selector") }}',
              default: defaultValues?.display === undefined ? true : defaultValues?.display,
              'x-decorator': 'FormItem',
              'x-component': 'Checkbox',
            },
          },
        },
      },
    }),
    [collectionList],
  );

  return <SchemaComponent components={components} scope={{ getEnableFieldTree }} schema={schema} />;
});
