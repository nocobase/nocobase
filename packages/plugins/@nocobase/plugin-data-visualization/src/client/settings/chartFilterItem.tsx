/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import {
  EditDescription,
  GeneralSchemaDesigner,
  SchemaSettingsItem,
  SchemaSettingsDivider,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
  VariablesContext,
  useCollection_deprecated,
  useCollectionManager_deprecated,
  useCompile,
  useDesignable,
  SchemaSettingsSelectItem,
  CollectionFieldOptions_deprecated,
  DEFAULT_DATA_SOURCE_KEY,
  useIsAssociationField,
  SchemaSettingsDataScope,
  removeNullCondition,
  useFormBlockContext,
  useLocalVariables,
  SchemaSettings,
  useApp,
  useIsFileField,
} from '@nocobase/client';
import { useChartsTranslation } from '../locale';
import { Schema, useField, useFieldSchema, ISchema } from '@formily/react';
import { Field } from '@formily/core';
import _ from 'lodash';
import { ChartFilterContext } from '../filter/FilterProvider';
import { getPropsSchemaByComponent, setDefaultValue } from '../filter/utils';
import { ChartFilterVariableInput } from '../filter/FilterVariableInput';
import { useChartDataSource, useChartFilter, useCollectionJoinFieldTitle } from '../hooks';
import { Typography } from 'antd';
import { getFormulaInterface } from '../utils';
const { Text } = Typography;

function useFieldComponentName(): string {
  const field = useField<Field>();
  const isFileField = useIsFileField();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const { getField } = useCollection_deprecated();
  const fieldSchema = useFieldSchema();
  const fieldName = fieldSchema.name as string;
  const collectionField = getField(fieldName) || getCollectionJoinField(fieldSchema['x-collection-field']);

  const map = {
    // AssociationField 的 mode 默认值是 Select
    AssociationField: 'Select',
    'DatePicker.FilterWithPicker': 'DatePicker',
  };
  const fieldComponentName =
    fieldSchema?.['x-component-props']?.['mode'] ||
    field?.componentProps?.['mode'] ||
    (isFileField ? 'FileManager' : '') ||
    fieldSchema?.['x-component-props']?.['component'] ||
    collectionField?.uiSchema?.['x-component'];
  return map[fieldComponentName] || fieldComponentName;
}

const EditTitle = () => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useChartsTranslation();
  const { dn } = useDesignable();
  const { setField } = useContext(ChartFilterContext);

  return (
    <SchemaSettingsModalItem
      key="edit-field-title"
      title={t('Edit field title')}
      schema={{
        type: 'object',
        title: t('Edit field title'),
        properties: {
          title: {
            title: t('Field title'),
            default: field?.title,
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-component-props': {},
          },
        },
      }}
      onSubmit={({ title }) => {
        if (title) {
          field.title = title;
          fieldSchema.title = title;
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              title: fieldSchema.title,
            },
          });
          setField(fieldSchema.name as string, { title });
        }
        dn.refresh();
      }}
    />
  );
};

const EditOperator = () => {
  const compile = useCompile();
  const fieldSchema = useFieldSchema();
  const field = useField<Field>();
  const { t } = useChartsTranslation();
  const { dn } = useDesignable();
  const { setField } = useContext(ChartFilterContext);
  const fieldName = fieldSchema['x-collection-field'];
  const dataSource = fieldSchema['x-data-source'] || DEFAULT_DATA_SOURCE_KEY;
  const { cm, fim } = useChartDataSource(dataSource);
  if (!cm) {
    return null;
  }

  const getOperators = (props: CollectionFieldOptions_deprecated) => {
    let fieldInterface = props?.interface;
    if (fieldInterface === 'formula') {
      fieldInterface = getFormulaInterface(props.dataType) || props.dataType;
    }
    const interfaceConfig = fim.getFieldInterface(fieldInterface);
    const operatorList = interfaceConfig?.filterable?.operators || [];
    return { operatorList, interfaceConfig };
  };

  let props = cm.getCollectionField(fieldName);
  let { operatorList, interfaceConfig } = getOperators(props);
  if (!operatorList.length) {
    const names = fieldName.split('.');
    const name = names.pop();
    if (names.length < 2) {
      return null;
    }
    props = cm.getCollectionField(names.join('.'));
    if (!props) {
      return null;
    }
    const res = getOperators(props);
    operatorList = res.operatorList;
    interfaceConfig = res.interfaceConfig;
    if (!interfaceConfig) {
      return null;
    }
    const children = interfaceConfig?.filterable.children || [];
    const child = children.find((item: any) => item.name === name);
    operatorList = child?.operators || [];
  }
  if (!operatorList.length) {
    return null;
  }
  const defaultComponent = interfaceConfig?.default?.uiSchema?.['x-component'] || 'Input';
  const operator = fieldSchema['x-component-props']?.['filter-operator'];

  const setOperatorComponent = (operator: any, component: any, props = {}) => {
    const componentProps = field.componentProps || {};
    field.componentProps = {
      ...componentProps,
      component,
      'filter-operator': operator,
      ...props,
    };
    fieldSchema['x-component-props'] = {
      ...fieldSchema['x-component-props'],
      component,
      'filter-operator': operator,
      ...props,
    };
    fieldSchema['x-filter-operator'] = operator?.value;
    dn.emit('patch', {
      schema: {
        'x-uid': fieldSchema['x-uid'],
        'x-component-props': {
          ...fieldSchema['x-component-props'],
          component,
          'filter-operator': operator,
          ...props,
        },
        'x-filter-operator': operator?.value,
      },
    });
  };

  return (
    <SchemaSettingsSelectItem
      key="operator"
      title={t('Operator')}
      value={operator?.value || operatorList[0]?.value}
      options={compile(operatorList)}
      onChange={(op: string) => {
        const operator = operatorList.find((item: any) => item.value === op);
        if (operator.noValue) {
          setOperatorComponent(operator, 'ChartFilterCheckbox', {
            content: Schema.compile(operator.label, { t }),
          });
        } else if (operator.schema?.['x-component']) {
          setOperatorComponent(operator, operator.schema['x-component'], operator.schema['x-component-props']);
        } else {
          setOperatorComponent(operator, defaultComponent);
        }

        setField(fieldSchema.name as string, { operator });
        dn.refresh();
      }}
    />
  );
};

const EditProps = () => {
  const { t } = useChartsTranslation();
  const { dn } = useDesignable();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const propsSchema = getPropsSchemaByComponent(fieldSchema['x-component']);
  return (
    <SchemaSettingsModalItem
      key="edit-field-props"
      title={t('Edit field properties')}
      schema={{
        title: t('Edit field properties'),
        ...propsSchema,
      }}
      initialValues={field.componentProps}
      onSubmit={(props) => {
        field.reset();
        field.componentProps = props;
        fieldSchema['x-component-props'] = props;
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            'x-component-props': props,
          },
        });
        dn.refresh();
      }}
    />
  );
};

const EditDefaultValue = () => {
  const { t } = useChartsTranslation();
  const { dn } = useDesignable();
  const variables = useContext(VariablesContext);
  const localVariables = useLocalVariables();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { getTranslatedTitle } = useChartFilter();
  const title = getTranslatedTitle(fieldSchema.title);
  return (
    <SchemaSettingsModalItem
      key="set field default value"
      title={t('Set default value')}
      components={{
        ChartFilterVariableInput,
      }}
      schema={{
        type: 'void',
        title: t('Set default value'),
        properties: {
          default: {
            title,
            'x-decorator': 'FormItem',
            'x-component': 'ChartFilterVariableInput',
            'x-component-props': {
              fieldSchema,
            },
          },
        },
      }}
      onSubmit={({ default: { value } }) => {
        field.setInitialValue(value);
        fieldSchema.default = value;
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            default: value,
          },
        });
        dn.refresh();
        setDefaultValue(field, variables, localVariables);
      }}
    />
  );
};

const EditTitleField = () => {
  const { getCollectionFields, getCollectionJoinField, getInterface } = useCollectionManager_deprecated();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useChartsTranslation();
  const { dn } = useDesignable();
  const compile = useCompile();
  const collectionField = getCollectionJoinField(fieldSchema['x-collection-field']);
  const targetFields = collectionField?.target
    ? getCollectionFields(collectionField?.target)
    : getCollectionFields(collectionField?.targetCollection) ?? [];
  const options = targetFields
    .filter((field) => {
      if (field?.target || field.type === 'boolean') {
        return false;
      }
      const fieldInterface = getInterface(field?.interface);
      return fieldInterface?.titleUsable;
    })
    .map((field) => ({
      value: field?.name,
      label: compile(field?.uiSchema?.title) || field?.name,
    }));

  return options.length > 0 && fieldSchema['x-component'] === 'CollectionField' ? (
    <SchemaSettingsSelectItem
      key="title-field"
      title={t('Title field')}
      options={options}
      value={field?.componentProps?.fieldNames?.label}
      onChange={(label: string) => {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        const fieldNames = {
          ...collectionField?.uiSchema?.['x-component-props']?.['fieldNames'],
          ...field.componentProps.fieldNames,
          label,
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props']['fieldNames'] = fieldNames;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps.fieldNames = fieldSchema['x-component-props'].fieldNames;
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      }}
    />
  ) : null;
};

const EditDataScope: React.FC = () => {
  const { dn } = useDesignable();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const dataSource = fieldSchema['x-data-source'] || DEFAULT_DATA_SOURCE_KEY;
  const { form } = useFormBlockContext();
  const { cm } = useChartDataSource(dataSource);
  const collectionField = cm.getCollectionField(fieldSchema['x-collection-field']);
  if (!collectionField) {
    return null;
  }
  return (
    <SchemaSettingsDataScope
      form={form}
      defaultFilter={fieldSchema?.['x-component-props']?.service?.params?.filter || {}}
      collectionName={collectionField.target}
      onSubmit={({ filter }) => {
        filter = removeNullCondition(filter);
        _.set(field.componentProps, 'service.params.filter', filter);
        fieldSchema['x-component-props'] = field.componentProps;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': field.componentProps,
          },
        });
      }}
    />
  );
};

export const chartFilterItemSettings = new SchemaSettings({
  name: 'chart:filterForm:item',
  items: [
    {
      name: 'originalTitle',
      Component: () => {
        const { t } = useChartsTranslation();
        const fieldSchema = useFieldSchema();
        const fieldName = fieldSchema.name as string;
        const isCustom = fieldName.startsWith('custom.');
        const dataSource = fieldSchema['x-data-source'] || DEFAULT_DATA_SOURCE_KEY;

        const originalTitle = useCollectionJoinFieldTitle(dataSource, fieldName);
        if (isCustom) {
          return null;
        }

        return (
          <>
            <SchemaSettingsItem title={fieldName}>
              <Text type="secondary">
                {t('Original field')}: {originalTitle}
              </Text>
            </SchemaSettingsItem>
            <SchemaSettingsDivider />
          </>
        );
      },
    },
    {
      name: 'decoratorOptions',
      type: 'itemGroup',
      hideIfNoChildren: true,
      useComponentProps() {
        const { t } = useChartsTranslation();
        return {
          title: t('Generic properties'),
        };
      },
      useChildren() {
        return [
          {
            name: 'title',
            Component: EditTitle,
          },
          {
            name: 'displayTitle',
            type: 'switch',
            useComponentProps() {
              const { t } = useChartsTranslation();
              const { dn } = useDesignable();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();

              return {
                title: t('Display title'),
                checked: fieldSchema['x-decorator-props']?.['showTitle'] ?? true,
                onChange(checked) {
                  fieldSchema['x-decorator-props'] = fieldSchema['x-decorator-props'] || {};
                  fieldSchema['x-decorator-props']['showTitle'] = checked;
                  field.decoratorProps.showTitle = checked;
                  dn.emit('patch', {
                    schema: {
                      'x-uid': fieldSchema['x-uid'],
                      'x-decorator-props': {
                        ...fieldSchema['x-decorator-props'],
                        showTitle: checked,
                      },
                    },
                  });
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'description',
            Component: EditDescription,
          },
          {
            name: 'editTooltip',
            type: 'modal',
            useComponentProps() {
              const { t } = useChartsTranslation();
              const { dn } = useDesignable();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();

              return {
                title: t('Edit tooltip'),
                schema: {
                  type: 'object',
                  title: t('Edit tooltip'),
                  properties: {
                    tooltip: {
                      default: fieldSchema?.['x-decorator-props']?.tooltip,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input.TextArea',
                      'x-component-props': {},
                    },
                  },
                } as ISchema,
                onSubmit({ tooltip }) {
                  field.decoratorProps.tooltip = tooltip;
                  fieldSchema['x-decorator-props'] = fieldSchema['x-decorator-props'] || {};
                  fieldSchema['x-decorator-props']['tooltip'] = tooltip;
                  dn.emit('patch', {
                    schema: {
                      'x-uid': fieldSchema['x-uid'],
                      'x-decorator-props': fieldSchema['x-decorator-props'],
                    },
                  });
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'defaultValue',
            Component: EditDefaultValue,
          },
          {
            name: 'operator',
            Component: () => {
              const fieldSchema = useFieldSchema();
              const fieldName = fieldSchema.name as string;
              const isCustom = fieldName.startsWith('custom.');
              if (isCustom) {
                return null;
              }
              return <EditOperator />;
            },
          },
          {
            name: 'props',
            Component: () => {
              const fieldSchema = useFieldSchema();
              const fieldName = fieldSchema.name as string;
              const isCustom = fieldName.startsWith('custom.');
              const hasProps = getPropsSchemaByComponent(fieldSchema['x-component']);
              if (hasProps && isCustom) {
                return <EditProps />;
              }
              return null;
            },
          },
        ];
      },
    },
    {
      name: 'componentOptions',
      type: 'itemGroup',
      hideIfNoChildren: true,
      useComponentProps() {
        const { t } = useChartsTranslation();
        return {
          title: t('Specific properties'),
        };
      },
      useChildren() {
        const fieldComponentNameMap = {
          Select: 'FilterSelect',
        };
        const app = useApp();
        const fieldComponentName = useFieldComponentName();
        const componentSettings = app.schemaSettingsManager.get(
          `fieldSettings:component:${fieldComponentNameMap[fieldComponentName] || fieldComponentName}`,
        );
        return componentSettings?.items || [];
      },
    },
    {
      name: 'divider',
      Component: () => {
        return <SchemaSettingsDivider />;
      },
    },
    {
      name: 'remove',
      Component: () => {
        const { t } = useChartsTranslation();

        return (
          <SchemaSettingsRemove
            key="remove"
            confirm={{
              title: t('Delete field'),
            }}
            breakRemoveOn={{
              'x-component': 'Grid',
            }}
          />
        );
      },
    },
  ],
});
