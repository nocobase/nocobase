import React, { useContext } from 'react';
import {
  EditDescription,
  GeneralSchemaDesigner,
  SchemaSettings,
  useCollection,
  useCollectionManager,
  useCompile,
  useDesignable,
} from '@nocobase/client';
import { useChartsTranslation } from '../locale';
import { useField, useFieldSchema } from '@formily/react';
import { Field } from '@formily/core';
import _ from 'lodash';
import { ChartFilterContext } from './FilterProvider';

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
  const { getCollectionFields, getInterface } = useCollectionManager();
  const [collection, name] = fieldName.split('.');
  const fields = getCollectionFields(collection);
  const props = fields.find((item) => item.name === name);
  const interfaceConfig = getInterface(props.interface);
  const operatorList = interfaceConfig?.filterable?.operators || [];
  const defaultComponent = interfaceConfig?.default?.uiSchema?.['x-component'] || 'Input';
  const operator = fieldSchema['x-component-props']?.filterOperator;

  const setOperatorComponent = (operator: string, component: any) => {
    const componentProps = field.componentProps || {};
    field.component = component;
    field.componentProps = {
      ...componentProps,
      filterOperator: operator,
    };
    fieldSchema['x-component'] = component;
    fieldSchema['x-component-props']['filterOperator'] = operator;
    dn.emit('patch', {
      schema: {
        'x-uid': fieldSchema['x-uid'],
        'x-component': component,
        'x-component-props': {
          ...fieldSchema['x-component-props'],
          filterOperator: operator,
        },
      },
    });
  };

  return operatorList.length ? (
    <SchemaSettings.SelectItem
      key="operator"
      title={t('Operator')}
      value={operator || operatorList[0]?.value}
      options={compile(operatorList)}
      onChange={(op: string) => {
        const operator = operatorList.find((item: any) => item.value === op);
        if (operator?.schema?.['x-component']) {
          setOperatorComponent(op, operator.schema['x-component']);
        } else {
          setOperatorComponent(op, defaultComponent);
        }

        addField(fieldName, { title: field.title, operator: op });
        dn.refresh();
      }}
    />
  ) : null;
};

export const ChartFilterItemDesigner: React.FC = () => {
  const { getCollectionJoinField } = useCollectionManager();
  const { getField } = useCollection();
  const { t } = useChartsTranslation();
  const fieldSchema = useFieldSchema();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const isCustom = (fieldSchema['name'] as string).startsWith('custom.');

  return (
    <GeneralSchemaDesigner disableInitializer>
      <EditTitle />
      <EditDescription />
      {!isCustom && <EditOperator />}
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
