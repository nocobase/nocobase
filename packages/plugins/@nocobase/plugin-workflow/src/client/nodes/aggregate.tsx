import { useForm } from '@formily/react';
import { Cascader } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

import {
  SchemaComponentContext,
  SchemaInitializerItemOptions,
  useCollectionDataSource,
  useCollectionManager,
  useCompile,
} from '@nocobase/client';

import { FieldsSelect } from '../components/FieldsSelect';
import { FilterDynamicComponent } from '../components/FilterDynamicComponent';
import { ValueBlock } from '../components/ValueBlock';
import { NAMESPACE, lang } from '../locale';
import { collection, filter } from '../schemas/collection';
import { BaseTypeSets, defaultFieldNames, nodesOptions, triggerOptions } from '../variable';

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
  const { getCollection } = useCollectionManager();
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
      const { collectionName, target, name } = field;

      const collection = getCollection(collectionName);
      const primaryKeyField = collection.fields.find((f) => f.primaryKey);

      setValuesIn('collection', target);

      onChange({
        name,
        // primary key data path
        associatedKey: `{{${path.slice(0, -1).join('.')}.${primaryKeyField.name}}}`,
        // data associated collection name
        associatedCollection: collectionName,
      });
    },
    [onChange],
  );

  return <Cascader {...props} value={p} options={options} onChange={onSelectChange} loadData={loadData as any} />;
}

// based on collection:
// { collection, field }

// based on data associated collection
// { key: '{{$context.data.id}}', collection: "collection.association", field }
// select data based

export default {
  title: `{{t("Aggregate", { ns: "${NAMESPACE}" })}}`,
  type: 'aggregate',
  group: 'collection',
  description: `{{t("Counting, summing, finding maximum, minimum, and average values for multiple records of a collection or associated data of a record.", { ns: "${NAMESPACE}" })}}`,
  fieldset: {
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
                  ...collection,
                  title: `{{t("Data of collection", { ns: "${NAMESPACE}" })}}`,
                  'x-component-props': {
                    ...collection['x-component-props'],
                    className: null,
                  },
                  'x-reactions': [
                    ...collection['x-reactions'],
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
          ...filter,
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
  view: {},
  scope: {
    useCollectionDataSource,
  },
  components: {
    SchemaComponentContext,
    FilterDynamicComponent,
    FieldsSelect,
    ValueBlock,
    AssociatedConfig,
  },
  useVariables({ id, title }, { types, fieldNames = defaultFieldNames }) {
    if (
      types &&
      !types.some((type) => type in BaseTypeSets || Object.values(BaseTypeSets).some((set) => set.has(type)))
    ) {
      return null;
    }
    return {
      [fieldNames.value]: `${id}`,
      [fieldNames.label]: title,
    };
  },
  useInitializers(node): SchemaInitializerItemOptions | null {
    if (!node.config.collection) {
      return null;
    }

    return {
      type: 'item',
      title: node.title ?? `#${node.id}`,
      component: ValueBlock.Initializer,
      node,
      resultTitle: lang('Query result'),
    };
  },
};
