import { observer } from '@formily/react';
import { Tag, TreeSelect } from 'antd';
import React from 'react';
import { AssociationSelect, SchemaComponent } from '../../schema-component';
import { AsDefaultTemplate } from './components/AsDefaultTemplate';
import { ArrayCollapse } from './components/DataTemplateTitle';
import { useCollectionState } from './hooks/useCollectionState';

export const FormDataTemplates = observer((props: any) => {
  const { useProps } = props;
  const { defaultValues, collectionName } = useProps();
  const { collectionList, getEnableFieldTree } = useCollectionState(collectionName);

  return (
    <SchemaComponent
      components={{ ArrayCollapse }}
      scope={{ getEnableFieldTree, getTagRender }}
      schema={{
        type: 'object',
        properties: {
          items: {
            type: 'array',
            default: defaultValues?.items,
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
                            label: item.id,
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
                        allowClear: true,
                        showCheckedStrategy: TreeSelect.SHOW_ALL,
                      },
                      'x-reactions': [
                        {
                          dependencies: ['.collection'],
                          fulfill: {
                            state: {
                              disabled: '{{ !$deps[0] }}',
                              componentProps: {
                                treeData: '{{ getEnableFieldTree($deps[0]) }}',
                                tagRender: '{{ getTagRender(getEnableFieldTree($deps[0])) }}',
                              },
                            },
                          },
                        },
                      ],
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
                title: '{{ t("Add template") }}',
                'x-component': 'ArrayCollapse.Addition',
              },
            },
          },
          display: {
            type: 'boolean',
            'x-content': '{{ t("Display data template selector") }}',
            default: defaultValues?.display !== false,
            'x-decorator': 'FormItem',
            'x-component': 'Checkbox',
          },
        },
      }}
    />
  );
});

function getTagRender(treeData: any) {
  return (props: any) => {
    const { value, onClose, disabled, closable } = props;
    const node = findLabel(value, treeData);
    return (
      <Tag
        color={node.color}
        closable={closable && !disabled}
        onClose={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose(e);
        }}
      >
        {node.label}
      </Tag>
    );
  };
}

function findLabel(field: string, treeData: any) {
  const list = field?.split('.') || [];
  const nodes = list.map((value, index) => {
    const data = treeData?.find((item: any) => item.value === list.slice(0, index + 1).join('.'));
    treeData = data?.children || [];
    return data;
  });

  const type = nodes[nodes.length - 1].type;
  const colors = {
    reference: 'blue',
    duplicate: 'green',
    preloading: 'cyan',
  };

  return {
    type,
    label: nodes.map((d) => d.tag).join('/'),
    color: colors[type],
  };
}
