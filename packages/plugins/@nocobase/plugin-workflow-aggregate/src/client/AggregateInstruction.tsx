/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { Cascader } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { BarChartOutlined } from '@ant-design/icons';

import {
  SchemaComponentContext,
  SchemaInitializerItemType,
  css,
  joinCollectionName,
  parseCollectionName,
  useCollectionDataSource,
  useCollectionFilterOptions,
  useCollectionManager_deprecated,
  useCompile,
} from '@nocobase/client';

import {
  FieldsSelect,
  FilterDynamicComponent,
  ValueBlock,
  BaseTypeSets,
  defaultFieldNames,
  nodesOptions,
  triggerOptions,
  Instruction,
} from '@nocobase/plugin-workflow/client';

import { NAMESPACE, useLang } from '../locale';

function matchToManyField(field): boolean {
  // const fieldPrefix = `${field.name}.`;
  return ['hasMany', 'belongsToMany'].includes(field.type);
}

function useAssociatedFields() {
  const compile = useCompile();
  return [nodesOptions, triggerOptions].map((item) => {
    const children = item
      .useOptions({
        types: [matchToManyField],
        appends: null,
        depth: 4,
      })
      ?.filter(Boolean);
    return {
      label: compile(item.label),
      value: item.value,
      key: item.value,
      children: compile(children),
      disabled: children && !children.length,
    };
  });
}

function AssociatedConfig({ value, onChange, ...props }): JSX.Element {
  const { setValuesIn } = useForm();
  const { getCollection } = useCollectionManager_deprecated();
  const baseOptions = useAssociatedFields();
  const [options, setOptions] = useState(baseOptions);

  const { associatedKey = '', name: fieldName } = value ?? {};
  let p = [];
  const matched = associatedKey.match(/^{{(.*)}}$/);
  if (matched) {
    p = [...matched[1].trim().split('.').slice(0, -1), fieldName];
  }

  const loadData = async (selectedOptions) => {
    const option = selectedOptions[selectedOptions.length - 1];
    if (!option.children?.length && !option.isLeaf && option.loadChildren) {
      await option.loadChildren(option);
      setOptions((prev) => [...prev]);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!p || options.length <= 1) {
        return;
      }
      let prevOption = null;

      for (let i = 0; i < p.length; i++) {
        const key = p[i];
        try {
          if (i === 0) {
            prevOption = options.find((item) => item.value === key);
          } else {
            if (prevOption.loadChildren && !prevOption.children?.length) {
              await prevOption.loadChildren(prevOption);
            }
            prevOption = prevOption.children.find((item) => item.value === key);
          }
        } catch (err) {
          console.error(err);
        }
      }
      setOptions([...options]);
    };

    run();
    // NOTE: watch `options.length` and it only happens once
  }, [value, options.length]);

  const onSelectChange = useCallback(
    (path, option) => {
      if (!path?.length) {
        setValuesIn('collection', null);
        onChange({});
        return;
      }

      // const associationFieldName = path.pop();
      const { field } = option.pop();
      if (!field || !['hasMany', 'belongsToMany'].includes(field.type)) {
        return;
      }
      // need to get:
      // * source collection (from node.config)
      // * target collection (from field name)
      const { collectionName, target, name, dataSourceKey } = field;

      const collection = getCollection(collectionName, dataSourceKey);
      const primaryKeyField = collection.fields.find((f) => f.primaryKey);

      setValuesIn('collection', joinCollectionName(dataSourceKey, target));

      onChange({
        name,
        // primary key data path
        associatedKey: `{{${path.slice(0, -1).join('.')}.${primaryKeyField.name}}}`,
        // data associated collection name
        associatedCollection: joinCollectionName(dataSourceKey, collectionName),
      });
    },
    [onChange],
  );

  return (
    <Cascader
      {...props}
      value={p}
      options={options}
      changeOnSelect
      onChange={onSelectChange}
      loadData={loadData as any}
    />
  );
}

// based on collection:
// { collection, field }

// based on data associated collection
// { key: '{{$context.data.id}}', collection: "collection.association", field }
// select data based

export default class extends Instruction {
  title = `{{t("Aggregate", { ns: "${NAMESPACE}" })}}`;
  type = 'aggregate';
  group = 'collection';
  description = `{{t("Counting, summing, finding maximum, minimum, and average values for multiple records of a collection or associated data of a record.", { ns: "${NAMESPACE}" })}}`;
  icon = (<BarChartOutlined style={{}} />);
  fieldset = {
    aggregator: {
      type: 'string',
      title: `{{t("Aggregator function", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        { label: 'COUNT', value: 'count' },
        { label: 'SUM', value: 'sum' },
        { label: 'AVG', value: 'avg' },
        { label: 'MIN', value: 'min' },
        { label: 'MAX', value: 'max' },
      ],
      required: true,
      default: 'count',
    },
    associated: {
      type: 'boolean',
      title: `{{t("Target type", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        { label: `{{t("Data of collection", { ns: "${NAMESPACE}" })}}`, value: false },
        { label: `{{t("Data of associated collection", { ns: "${NAMESPACE}" })}}`, value: true },
      ],
      required: true,
      default: false,
      'x-reactions': [
        {
          target: 'collection',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: null,
            },
          },
        },
        {
          target: 'association',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: null,
            },
          },
        },
      ],
    },
    collectionField: {
      type: 'void',
      'x-decorator': 'SchemaComponentContext.Provider',
      'x-decorator-props': {
        value: { designable: false },
      },
      'x-component': 'Grid',
      properties: {
        row: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            target: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                collection: {
                  type: 'string',
                  required: true,
                  'x-decorator': 'FormItem',
                  'x-component': 'DataSourceCollectionCascader',
                  'x-component-props': {
                    dataSourceFilter(datasource) {
                      return datasource.key === 'main' || datasource.options.isDBInstance;
                    },
                  },
                  title: `{{t("Data of collection", { ns: "${NAMESPACE}" })}}`,
                  'x-reactions': [
                    {
                      dependencies: ['associated'],
                      fulfill: {
                        state: {
                          display: '{{$deps[0] ? "hidden" : "visible"}}',
                        },
                      },
                    },
                    {
                      target: 'params.field',
                      effects: ['onFieldValueChange'],
                      fulfill: {
                        state: {
                          value: null,
                        },
                      },
                    },
                    {
                      target: 'params.filter',
                      effects: ['onFieldValueChange'],
                      fulfill: {
                        state: {
                          value: null,
                        },
                      },
                    },
                  ],
                },
                association: {
                  type: 'object',
                  title: `{{t("Data of associated collection", { ns: "${NAMESPACE}" })}}`,
                  'x-decorator': 'FormItem',
                  'x-component': 'AssociatedConfig',
                  'x-component-props': {
                    changeOnSelect: true,
                  },
                  'x-reactions': [
                    {
                      dependencies: ['associated'],
                      fulfill: {
                        state: {
                          visible: '{{!!$deps[0]}}',
                        },
                      },
                    },
                  ],
                  required: true,
                },
              },
            },
            field: {
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                'params.field': {
                  type: 'string',
                  title: `{{t("Field to aggregate", { ns: "${NAMESPACE}" })}}`,
                  'x-decorator': 'FormItem',
                  'x-component': 'FieldsSelect',
                  'x-component-props': {
                    filter(field) {
                      return (
                        !field.hidden &&
                        field.interface &&
                        !['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type)
                      );
                    },
                  },
                  required: true,
                  'x-reactions': [
                    {
                      dependencies: ['collection'],
                      fulfill: {
                        state: {
                          visible: '{{!!$deps[0]}}',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    params: {
      type: 'object',
      properties: {
        distinct: {
          type: 'boolean',
          title: `{{t("Distinct", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'FormItem',
          'x-component': 'Checkbox',
          'x-reactions': [
            {
              dependencies: ['collection', 'aggregator'],
              fulfill: {
                state: {
                  visible: '{{!!$deps[0] && ["count"].includes($deps[1])}}',
                },
              },
            },
          ],
        },
        filter: {
          type: 'object',
          title: '{{t("Filter")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Filter',
          'x-use-component-props': () => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { values } = useForm();
            const [dataSourceName, collectionName] = parseCollectionName(values?.collection);
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const options = useCollectionFilterOptions(collectionName, dataSourceName);
            return {
              options,
              className: css`
                position: relative;
                width: 100%;
              `,
            };
          },
          'x-component-props': {
            dynamicComponent: 'FilterDynamicComponent',
          },
          'x-reactions': [
            {
              dependencies: ['collection'],
              fulfill: {
                state: {
                  visible: '{{!!$deps[0]}}',
                },
              },
            },
          ],
        },
      },
    },
  };
  scope = {
    useCollectionDataSource,
  };
  components = {
    SchemaComponentContext,
    FilterDynamicComponent,
    FieldsSelect,
    ValueBlock,
    AssociatedConfig,
  };
  useVariables({ key, title }, { types, fieldNames = defaultFieldNames }) {
    if (
      types &&
      !types.some((type) => type in BaseTypeSets || Object.values(BaseTypeSets).some((set) => set.has(type)))
    ) {
      return null;
    }
    return {
      [fieldNames.value]: key,
      [fieldNames.label]: title,
    };
  }
  useInitializers(node): SchemaInitializerItemType | null {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const resultTitle = useLang('Query result');
    if (!node.config.collection) {
      return null;
    }

    return {
      name: `#${node.id}`,
      type: 'item',
      title: node.title ?? `#${node.id}`,
      Component: ValueBlock.Initializer,
      node,
      resultTitle,
    };
  }
}
