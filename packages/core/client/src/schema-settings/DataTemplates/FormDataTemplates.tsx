import { Field } from '@formily/core';
import { connect, mapProps, observer } from '@formily/react';
import { observable } from '@formily/reactive';
import { Tree as AntdTree } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager_deprecated } from '../../collection-manager';
import { mergeFilter } from '../../filter-provider/utils';
import { SchemaComponent, SchemaComponentContext, removeNullCondition } from '../../schema-component';
import { ITemplate } from '../../schema-component/antd/form-v2/Templates';
import { VariableInput } from '../VariableInput';
import { AsDefaultTemplate } from './components/AsDefaultTemplate';
import { ArrayCollapse } from './components/DataTemplateTitle';
import { getSelectedIdFilter } from './components/Designer';
import { useCollectionState } from './hooks/useCollectionState';
import { useSyncFromForm } from './utils';

const Tree = connect(
  AntdTree,
  mapProps({
    value: 'checkedKeys',
    dataSource: 'treeData',
  }),
);

Tree.displayName = 'Tree';

export const compatibleDataId = (data, config?) => {
  return data?.map((v) => {
    const { dataId, ...others } = v;
    const obj = { ...others };
    if (dataId) {
      obj.dataScope = { $and: [{ id: { $eq: dataId } }] };
      obj.titleField = obj?.titleField || config?.[v.collection]?.['titleField'] || 'id';
    }
    return obj;
  });
};

export const FormDataTemplates = observer(
  (props: any) => {
    const { useProps, formSchema, designerCtx } = props;
    const { defaultValues, collectionName } = useProps();
    const {
      collectionList,
      getEnableFieldTree,
      getOnLoadData,
      getOnCheck,
      getScopeDataSource,
      useTitleFieldDataSource,
    } = useCollectionState(collectionName);
    const { getCollection, getCollectionField } = useCollectionManager_deprecated();
    const { t } = useTranslation();
    // 不要在后面的数组中依赖 defaultValues，否则会因为 defaultValues 的变化导致 activeData 响应性丢失
    const activeData = useMemo<ITemplate>(
      () =>
        observable(
          { ...defaultValues, items: compatibleDataId(defaultValues?.items || [], defaultValues?.config) } || {
            items: [],
            display: true,
            config: { [collectionName]: { titleField: '', filter: {} } },
          },
        ),
      [],
    );
    const getTargetField = (collectionName: string) => {
      const collection = getCollection(collectionName);
      return getCollectionField(
        `${collectionName}.${activeData?.config[collectionName]?.titleField || collection?.titleField || 'id'}`,
      );
    };

    const getFieldNames = (collectionName: string) => {
      const collection = getCollection(collectionName);
      return {
        label: getLabel(activeData.config?.[collectionName]?.titleField || collection?.titleField || 'id'),
        value: 'id',
      };
    };

    const getFilter = (collectionName: string, value: any) => {
      const filter = activeData.config?.[collectionName]?.filter;
      return _.isEmpty(filter) ? {} : removeNullCondition(mergeFilter([filter, getSelectedIdFilter(value)], '$or'));
    };
    const components = useMemo(() => ({ ArrayCollapse }), []);

    const scope = useMemo(
      () => ({
        getEnableFieldTree,
        getTargetField,
        getFieldNames,
        getFilter,
        getResource,
        getOnLoadData,
        getOnCheck,
        collectionName,
        getScopeDataSource,
        useTitleFieldDataSource,
      }),
      [],
    );
    const schema = useMemo(
      () => ({
        type: 'object',
        properties: {
          items: {
            type: 'array',
            default: activeData?.items,
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
                      default: '{{ collectionName }}',
                      'x-display': collectionList.length > 1 ? 'visible' : 'hidden',
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      'x-component-props': {
                        options: collectionList,
                      },
                    },
                    dataScope: {
                      type: 'object',
                      title: '{{ t("Assign  data scope for the template") }}',
                      'x-decorator': 'FormItem',
                      'x-component': 'Filter',
                      'x-component-props': {
                        dynamicComponent: VariableInput,
                      },
                      'x-decorator-props': {
                        style: {
                          marginBottom: '0px',
                        },
                      },
                      required: true,
                      'x-reactions': [
                        {
                          dependencies: ['.collection'],
                          fulfill: {
                            state: {
                              disabled: '{{ !$deps[0] }}',
                            },
                            schema: {
                              enum: '{{ getScopeDataSource($deps[0]) }}',
                            },
                          },
                        },
                      ],
                    },
                    titleField: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      title: '{{ t("Title field") }}',
                      'x-component': 'Select',
                      required: true,
                      'x-reactions': '{{useTitleFieldDataSource}}',
                    },
                    syncFromForm: {
                      type: 'void',
                      title: '{{ t("Sync from form fields") }}',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        type: 'primary',
                        style: { float: 'right', position: 'relative', zIndex: 1200 },
                        useAction: () => useSyncFromForm(formSchema),
                      },
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
                        loadData: '{{ getOnLoadData($self) }}',
                        onCheck: '{{ getOnCheck($self) }}',
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
            default: activeData?.display !== false,
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
  },
  { displayName: 'FormDataTemplates' },
);

export function getLabel(titleField) {
  return titleField || 'label';
}

function getResource(resource: string, field: Field) {
  if (resource !== field.componentProps.service.resource) {
    // 切换 collection 后，之前选中的其它 collection 的数据就没有意义了，需要清空
    field.value = undefined;
  }
  return resource;
}
