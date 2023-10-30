import React, { useContext } from 'react';
import {
  EditDescription,
  GeneralSchemaDesigner,
  SchemaSettings,
  VariablesContext,
  useCollection,
  useCollectionManager,
  useCompile,
  useDesignable,
} from '@nocobase/client';
import { useChartsTranslation } from '../locale';
import { Schema, useField, useFieldSchema } from '@formily/react';
import { Field } from '@formily/core';
import _ from 'lodash';
import { ChartFilterContext } from './FilterProvider';
import { getPropsSchemaByComponent, setDefaultValue } from './utils';
import { ChartFilterVariableInput } from './FilterVariableInput';
import { useChartFilter } from '../hooks';

const EditTitle = () => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useChartsTranslation();
  const { dn } = useDesignable();

  return (
    <SchemaSettings.ModalItem
      key="edit-field-title"
      title={t('Edit field title')}
      schema={{
        type: 'object',
        title: t('Edit field title'),
        properties: {
          title: {
            title: t('Field title'),
            default: field?.title,
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
        }
        dn.refresh();
      }}
    />
  );
};

const EditOperator = () => {
  const compile = useCompile();
  const fieldSchema = useFieldSchema();
  const fieldName = fieldSchema.name as string;
  const field = useField<Field>();
  const { t } = useChartsTranslation();
  const { dn } = useDesignable();
  const { addField } = useContext(ChartFilterContext);
  const { getInterface, getCollectionJoinField } = useCollectionManager();
  const props = getCollectionJoinField(fieldName);
  const interfaceConfig = getInterface(props?.interface);
  const operatorList = interfaceConfig?.filterable?.operators || [];
  const defaultComponent = interfaceConfig?.default?.uiSchema?.['x-component'] || 'Input';
  const operator = fieldSchema['x-component-props']?.['filter-operator'];

  const setOperatorComponent = (operator: any, component: any, props = {}) => {
    const componentProps = field.componentProps || {};
    field.component = component;
    field.componentProps = {
      ...componentProps,
      'filter-operator': operator,
      ...props,
    };
    fieldSchema['x-component'] = component;
    fieldSchema['x-component-props'] = {
      ...fieldSchema['x-component-props'],
      'filter-operator': operator,
      ...props,
    };
    dn.emit('patch', {
      schema: {
        'x-uid': fieldSchema['x-uid'],
        'x-component': component,
        'x-component-props': {
          ...fieldSchema['x-component-props'],
          'filter-operator': operator,
          ...props,
        },
      },
    });
  };

  return operatorList.length ? (
    <SchemaSettings.SelectItem
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
          setOperatorComponent(operator, operator.schema['x-component']);
        } else {
          setOperatorComponent(operator, defaultComponent);
        }

        addField(fieldName, { title: field.title, operator });
        dn.refresh();
      }}
    />
  ) : null;
};

const EditProps = () => {
  const { t } = useChartsTranslation();
  const { dn } = useDesignable();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const propsSchema = getPropsSchemaByComponent(fieldSchema['x-component']);
  return (
    <SchemaSettings.ModalItem
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

const SetDefaultValue = () => {
  const { t } = useChartsTranslation();
  const { dn } = useDesignable();
  const variables = useContext(VariablesContext);
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { getTranslatedTitle } = useChartFilter();
  const title = getTranslatedTitle(fieldSchema.title);
  return (
    <SchemaSettings.ModalItem
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
        field.componentProps.defaultValue = value;
        fieldSchema['x-component-props'].defaultValue = value;
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            'x-component-props': {
              ...fieldSchema['x-component-props'],
              defaultValue: value,
            },
          },
        });
        dn.refresh();
        field.setValue(null);
        setDefaultValue(field, variables);
      }}
    />
  );
};

export const ChartFilterItemDesigner: React.FC = () => {
  const { getCollectionJoinField } = useCollectionManager();
  const { getField } = useCollection();
  const { t } = useChartsTranslation();
  const fieldSchema = useFieldSchema();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const isCustom = (fieldSchema['name'] as string).startsWith('custom.');
  const hasProps = getPropsSchemaByComponent(fieldSchema['x-component']);
  return (
    <GeneralSchemaDesigner disableInitializer>
      <EditTitle />
      <EditDescription />
      {hasProps && isCustom && <EditProps />}
      {!isCustom && <EditOperator />}
      <SetDefaultValue />
      {collectionField ? <SchemaSettings.Divider /> : null}
      <SchemaSettings.Remove
        key="remove"
        confirm={{
          title: t('Delete field'),
        }}
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
