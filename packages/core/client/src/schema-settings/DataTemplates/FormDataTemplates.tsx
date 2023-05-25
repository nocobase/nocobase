import { connect, mapProps, observer } from '@formily/react';
import { Tree as AntdTree } from 'antd';
import React, { useMemo } from 'react';
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
    // onInput: 'onCheck',
  }),
);

export const FormDataTemplates = observer((props: any) => {
  const { useProps } = props;
  const { defaultValues, collectionName } = useProps();
  const { collectionList, getEnableFieldTree, onLoadData, onCheck } = useCollectionState(collectionName);
  const { getCollection, getCollectionField } = useCollectionManager();
  const collection = getCollection(collectionName);
  const { t } = useTranslation();
  const field = getCollectionField(`${collectionName}.${collection?.titleField || 'id'}`);
  const components = useMemo(() => ({ ArrayCollapse }), []);
  const scope = useMemo(() => ({ getEnableFieldTree }), []);
  const schema = useMemo(
    () => ({
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
              extra: [<AsDefaultTemplate key="0" />],
            },
            properties: {
              layout: {
                type: 'void',
                'x-component': 'FormLayout',
                'x-component-props': {
                  layout: 'vertical',
                },
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
                      targetField: field,
                      mapOptions(option) {
                        try {
                          const label = getLabel(collection);
                          option[label] = (
                            <>
                              #{option.id} {option[label]}
                            </>
                          );

                          return option;
                        } catch (error) {
                          console.error(error);
                          return option;
                        }
                      },
                      fieldNames: {
                        label: getLabel(collection),
                        value: 'id',
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
                      checkStrictly: true,
                      selectable: false,
                      loadData: onLoadData,
                      onCheck,
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
                              treeData: '{{ getEnableFieldTree($deps[0], $self) }}',
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
    }),
    [],
  );

  return <SchemaComponent components={components} scope={scope} schema={schema} />;
});

function getLabel(collection: any) {
  return !collection?.titleField || collection.titleField === 'id' ? 'label' : collection?.titleField;
}
