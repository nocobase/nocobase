import { connect, mapProps, observer } from '@formily/react';
import { Tree as AntdTree } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager } from '../../collection-manager';
import { AssociationSelect, SchemaComponent } from '../../schema-component';
import { AsDefaultTemplate } from './components/AsDefaultTemplate';
import { ArrayCollapse } from './components/DataTemplateTitle';
import { useCollectionState } from './hooks/useCollectionState';

const Tree = connect(
  AntdTree,
  mapProps({
    value: 'checkedKeys',
    dataSource: 'treeData',
    onInput: 'onCheck',
  }),
);

export const FormDataTemplates = observer((props: any) => {
  const { useProps } = props;
  const { defaultValues, collectionName } = useProps();
  const { collectionList, getEnableFieldTree } = useCollectionState(collectionName);
  const { getCollection } = useCollectionManager();
  const collection = getCollection(collectionName);
  const { t } = useTranslation();

  return (
    <SchemaComponent
      components={{ ArrayCollapse }}
      scope={{ getEnableFieldTree }}
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
                      description: t('If collection inherits, choose inherited collections as templates'),
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
                      description: t('Select an existing piece of data as the initialization data for the form'),
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
                          return {
                            ...item,
                            [collection.titleField || 'label']: `#${item.id} ${item[collection.titleField] || ''}`,
                            value: item.id,
                          };
                        },
                        fieldNames: {
                          label: collection.titleField || 'label',
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
                      description: t('Only the selected fields will be used as the initialization data for the form'),
                      'x-decorator': 'FormItem',
                      'x-component': Tree,
                      'x-component-props': {
                        treeData: [],
                        checkable: true,
                        selectable: false,
                        rootStyle: {
                          padding: '8px 0',
                          border: '1px solid #d9d9d9',
                          borderRadius: '2px',
                          maxHeight: '30vh',
                          overflow: 'auto',
                          margin: '2px 0',
                        },
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
