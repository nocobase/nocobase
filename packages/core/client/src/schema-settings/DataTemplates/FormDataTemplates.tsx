import { connect, mapProps, observer } from '@formily/react';
import { Tree as AntdTree } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager } from '../../collection-manager';
import { AssociationSelect, SchemaComponent, SchemaComponentContext } from '../../schema-component';
import { AsDefaultTemplate } from './components/AsDefaultTemplate';
import { ArrayCollapse } from './components/DataTemplateTitle';
import { Designer } from './components/Designer';
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
  const { useProps, formSchema, designerCtx } = props;
  // defaultValues 加个默认值，防止没有数据时，无法渲染 Designer
  const { defaultValues = { items: [{}] }, collectionName } = useProps();
  const { collectionList, getEnableFieldTree, onLoadData, onCheck } = useCollectionState(collectionName);
  const { getCollection, getCollectionField } = useCollectionManager();
  const collection = getCollection(collectionName);
  const { t } = useTranslation();
  const components = useMemo(() => ({ ArrayCollapse }), []);
  const scope = useMemo(
    () => ({
      getEnableFieldTree,
      getMapOptions,
      getLabel,
      getFieldNames,
      getCollectionField,
      collection,
      collectionName,
      items: defaultValues?.items || [],
    }),
    [],
  );
  const schema = useMemo(
    () => ({
      type: 'object',
      properties: {
        items: {
          type: 'array',
          default: '{{ items }}',
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
                    'x-designer': Designer,
                    'x-designer-props': {
                      formSchema,
                      data: defaultValues,
                      collectionName,
                    },
                    'x-data': '{{ $index }}',
                    'x-decorator': 'FormItem',
                    'x-component': AssociationSelect,
                    'x-component-props': {
                      service: {
                        resource: collectionName,
                        params: {
                          filter: '{{ $record.filter }}',
                        },
                      },
                      action: 'list',
                      multiple: false,
                      objectValue: false,
                      manual: false,
                      targetField:
                        '{{ getCollectionField(`${collectionName}.${$record.titleField || collection?.titleField || "id"}`) }}',
                      mapOptions: '{{ getMapOptions() }}',
                      fieldNames: '{{ getFieldNames($record, collection) }}',
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

  return (
    <SchemaComponentContext.Provider value={{ ...designerCtx, designable: true }}>
      <SchemaComponent components={components} scope={scope} schema={schema} />
    </SchemaComponentContext.Provider>
  );
});

export function getLabel(titleField) {
  return !titleField ? 'label' : titleField;
}

function getMapOptions() {
  return (option) => {
    if (option?.id === undefined) {
      return null;
    }
    return option;
  };
}

function getFieldNames(record, collection) {
  return {
    label: getLabel(record.titleField || collection?.titleField || 'id'),
    value: 'id',
  };
}
