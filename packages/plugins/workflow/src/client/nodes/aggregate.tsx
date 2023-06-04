import React, { useCallback } from 'react';
import { Cascader } from 'antd';
import { useForm } from '@formily/react';

import {
  SchemaInitializerItemOptions,
  useCollectionDataSource,
  useCompile,
  SchemaComponentContext,
  useCollectionManager,
} from '@nocobase/client';

import { collection, filter } from '../schemas/collection';
import { NAMESPACE, lang } from '../locale';
import { FilterDynamicComponent } from '../components/FilterDynamicComponent';
import { BaseTypeSets, nodesOptions, triggerOptions, useWorkflowVariableOptions } from '../variable';
import { FieldsSelect } from '../components/FieldsSelect';
import { ValueBlock } from '../components/ValueBlock';
import { useNodeContext } from '.';

function matchToManyField(field, depth): boolean {
  return ['hasMany', 'belongsToMany'].includes(field.type) && depth;
}

function AssociatedConfig({ value, onChange, ...props }): JSX.Element {
  const { setValuesIn } = useForm();
  const compile = useCompile();
  const { getCollection } = useCollectionManager();
  const current = useNodeContext();
  const options = [nodesOptions, triggerOptions].map((item) => {
    const children = item.useOptions({ types: [matchToManyField] })?.filter(Boolean);
    return {
      label: compile(item.label),
      value: item.value,
      key: item.value,
      children: compile(children),
      disabled: children && !children.length,
    };
  });

  const { associatedKey = '', name: fieldName } = value ?? {};
  let p = [];
  const matched = associatedKey.match(/^{{(.*)}}$/);
  if (matched) {
    p = [...matched[1].trim().split('.').slice(0, -1), fieldName];
  }

  const onSelectChange = useCallback(
    (path, option) => {
      if (!path?.length) {
        setValuesIn('collection', null);
        onChange({});
        return;
      }

      // const associationFieldName = path.pop();
      const { field } = option.pop();
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

  return <Cascader {...props} value={p} options={options} onChange={onSelectChange} />;
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
                    className: 'full-width',
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
                    className: 'full-width',
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
  useVariables(current, { types }) {
    if (
      types &&
      !types.some((type) => type in BaseTypeSets || Object.values(BaseTypeSets).some((set) => set.has(type)))
    ) {
      return null;
    }
    return [
      // { key: '', value: '', label: lang('Calculation result') }
    ];
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
