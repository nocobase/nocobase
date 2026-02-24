import {
  ActionContextProvider,
  css,
  parseCollectionName,
  SchemaComponent,
  SchemaComponentContext,
  SchemaInitializer,
  SchemaInitializerItem,
  useActionContext,
  useAPIClient,
  useCollectionFilterOptions,
  useCollectionManager_deprecated,
  useCompile,
  useVariableScopeInfo,
  VariableInput,
} from '@nocobase/client';
import React, { FC } from 'react';
import { NAMESPACE } from '../locale';
import { observer, useForm } from '@formily/react';
import { Select } from 'antd';
import { uid } from '@nocobase/utils/client';
import { useAddVariableButtonProps } from './AddVariableButton';
import { DrawerDescription } from './DrawerDescription';
import { BarChartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

function FilterDynamicComponent({ value, onChange, renderSchemaComponent }) {
  return <VariableInput value={value} onChange={onChange} renderSchemaComponent={renderSchemaComponent} />;
}

function defaultFilter() {
  return true;
}

const FieldsSelect = observer(
  (props: any) => {
    const { filter = defaultFilter, ...others } = props;
    const compile = useCompile();
    const { getCollectionFields } = useCollectionManager_deprecated();
    const { values } = useForm();
    const [dataSourceName, collectionName] = parseCollectionName(values?.collection);
    const fields = getCollectionFields(collectionName, dataSourceName);

    return (
      <Select
        popupMatchSelectWidth={false}
        {...others}
        options={fields.filter(filter).map((field) => ({
          label: compile(field.uiSchema?.title),
          value: field.name,
        }))}
      />
    );
  },
  { displayName: 'FieldsSelect' },
);

const getAggregateVariableSchema = (initialValues: any, action: string) => {
  const titleMap = {
    create: `{{t("Add aggregate variable", { ns: "${NAMESPACE}" })}}`,
    update: `{{t("Edit aggregate variable", { ns: "${NAMESPACE}" })}}`,
  };

  return {
    type: 'object',
    properties: {
      [action]: {
        'x-decorator': 'Form',
        'x-component': 'Action.Drawer',
        'x-component-props': {
          zIndex: 9999,
        },
        type: 'void',
        title: titleMap[action],
        properties: {
          description: {
            type: 'void',
            'x-component': DrawerDescription,
            'x-component-props': {
              label: `{{t("Variable type", { ns: "${NAMESPACE}" })}}`,
              title: `{{t("Aggregate", { ns: "${NAMESPACE}" })}}`,
              icon: <BarChartOutlined />,
              description: `{{t("Create an aggregate variable that performs statistical calculations (COUNT, SUM, AVG, MIN, MAX) on data from a specific collection. You can apply filters to narrow down the data scope and optionally use distinct values for counting operations.", { ns: "${NAMESPACE}" })}}`,
            },
          },
          variableTitle: {
            type: 'string',
            title: `{{t("Variable name", { ns: "${NAMESPACE}" })}}`,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            required: true,
            default: initialValues?.label,
          },
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
            default: initialValues?.options.aggregator || 'count',
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
                        default: initialValues?.options.collection,
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
                        'x-component': FieldsSelect,
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
                        default: initialValues?.options.params.field,
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
                'x-decorator': 'FormItem',
                'x-component': 'Checkbox',
                'x-content': `{{t("Distinct", { ns: "${NAMESPACE}" })}}`,
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
                default: initialValues?.options.params.distinct,
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
                  dynamicComponent: FilterDynamicComponent,
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
                default: initialValues?.options.params.filter,
              },
            },
          },
          precision: {
            type: 'number',
            title: `{{t("Result precision", { ns: "${NAMESPACE}" })}}`,
            description: `{{t("Number of decimal places for query result.", { ns: "${NAMESPACE}" })}}`,
            'x-decorator': 'FormItem',
            'x-component': 'InputNumber',
            'x-component-props': {
              min: 0,
              max: 14,
              step: 1,
              precision: 0,
            },
            default: initialValues?.options.precision ?? 2,
          },
          footer: {
            'x-component': 'Action.Drawer.Footer',
            type: 'void',
            properties: {
              cancel: {
                title: '{{t("Cancel")}}',
                'x-component': 'Action',
                'x-component-props': {
                  useAction: () => {
                    const { setVisible } = useActionContext();
                    const form = useForm();
                    return {
                      async run() {
                        setVisible(false);
                        await form.reset();
                      },
                    };
                  },
                },
              },
              submit: {
                title: '{{t("Submit")}}',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction: () => {
                    const { setVisible } = useActionContext();
                    const form = useForm();
                    const { getVariableScopeInfo } = useVariableScopeInfo();
                    const api = useAPIClient();
                    const { onSuccess } = useAddVariableButtonProps();

                    return {
                      async run() {
                        await form.submit();
                        const { variableTitle, ...options } = form.values;
                        const scopeInfo = getVariableScopeInfo();

                        if (!scopeInfo.scopeId) {
                          throw new Error('Scope info not found');
                        }

                        if (action === 'update') {
                          await api.request({
                            url: `customVariables:update`,
                            method: 'POST',
                            params: { filterByTk: initialValues.name },
                            data: {
                              label: variableTitle,
                              options,
                            },
                          });
                        }

                        if (action === 'create') {
                          await api.request({
                            url: `customVariables:create`,
                            method: 'POST',
                            data: {
                              name: uid(),
                              label: variableTitle,
                              declaredAt: scopeInfo.scopeId,
                              type: 'aggregate',
                              options,
                            },
                          });
                        }

                        await form.reset();
                        setVisible(false);
                        onSuccess?.();
                      },
                    };
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};

export const variableInitializer = new SchemaInitializer({
  name: 'customVariables:addVariable',
  title: `{{t("Add variable", { ns: "${NAMESPACE}" })}}`,
  icon: 'PlusOutlined',
  items: [
    {
      name: 'aggregateVariable',
      title: `{{t("Aggregate variable", { ns: "${NAMESPACE}" })}}`,
      Component: () => {
        const [visible, setVisible] = React.useState(false);
        const handleClick = () => {
          setVisible(true);
        };
        const { t } = useTranslation(NAMESPACE);

        return (
          <>
            <SchemaInitializerItem title={t('Aggregate variable')} onClick={handleClick} />
            <ActionContextProvider value={{ visible, setVisible }}>
              <SchemaComponentContext.Provider value={{ designable: false }}>
                <SchemaComponent schema={getAggregateVariableSchema(undefined, 'create')} />
              </SchemaComponentContext.Provider>
            </ActionContextProvider>
          </>
        );
      },
    },
  ],
});

export const VariableEditor: FC<{
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  initialValues: any;
}> = ({ visible, setVisible, initialValues }) => {
  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <SchemaComponentContext.Provider value={{ designable: false }}>
        <SchemaComponent schema={getAggregateVariableSchema(initialValues, 'update')} />
      </SchemaComponentContext.Provider>
    </ActionContextProvider>
  );
};
