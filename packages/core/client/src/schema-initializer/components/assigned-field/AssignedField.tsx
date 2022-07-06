import { Field } from '@formily/core';
import { connect, useField, useFieldSchema } from '@formily/react';
import { Cascader, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../../block-provider';
import {
  CollectionFieldProvider,
  useCollection,
  useCollectionField,
  useCollectionFilterOptions,
} from '../../../collection-manager';
import { useCompile, useComponent } from '../../../schema-component';

const InternalField: React.FC = (props) => {
  const field = useField<Field>();

  const fieldSchema = useFieldSchema();
  const { name, interface: interfaceType, uiSchema } = useCollectionField();
  const component = useComponent(uiSchema?.['x-component']);
  const compile = useCompile();
  const setFieldProps = (key, value) => {
    field[key] = typeof field[key] === 'undefined' ? value : field[key];
  };
  const setRequired = () => {
    if (typeof fieldSchema['required'] === 'undefined') {
      field.required = !!uiSchema['required'];
    }
  };
  const ctx = useFormBlockContext();

  useEffect(() => {
    if (ctx?.field) {
      ctx.field.added = ctx.field.added || new Set();
      ctx.field.added.add(fieldSchema.name);
    }
  });

  useEffect(() => {
    if (!uiSchema) {
      return;
    }
    setFieldProps('content', uiSchema['x-content']);
    setFieldProps('title', uiSchema.title);
    setFieldProps('description', uiSchema.description);
    setFieldProps('initialValue', uiSchema.default);
    if (!field.validator && uiSchema['x-validator']) {
      field.validator = uiSchema['x-validator'];
    }
    if (fieldSchema['x-disabled'] === true) {
      field.disabled = true;
    }
    if (fieldSchema['x-read-pretty'] === true) {
      field.readPretty = true;
    }
    setRequired();
    // @ts-ignore
    // field.dataSource = uiSchema.enum;
    // const originalProps = compile(uiSchema['x-component-props']) || {};
    // const componentProps = merge(originalProps, field.componentProps || {});
    // field.component = [component, componentProps];
  }, [JSON.stringify(uiSchema)]);
  if (!uiSchema) {
    return null;
  }
  return React.createElement(component, props, props.children);
};

const CollectionField = connect((props) => {
  const fieldSchema = useFieldSchema();
  return (
    <CollectionFieldProvider name={fieldSchema.name}>
      <InternalField {...props} />
    </CollectionFieldProvider>
  );
});

export enum AssignedFieldValueType {
  ConstantValue = 'constantValue',
  DynamicValue = 'dynamicValue',
}

export const AssignedField = (props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const [type, setType] = useState<string>(field.value?.type ?? AssignedFieldValueType.ConstantValue);
  const [value, setValue] = useState(field.value?.value ?? '');
  const [options, setOptions] = useState<any[]>([]);
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const fields = useCollectionFilterOptions(collectionField?.collectionName);
  useEffect(() => {
    const opt = [
      ...fields,
      {
        name: '{{currentUser}}',
        title: t('Current user'),
      },
      {
        name: '{{currentTime}}',
        title: t('Current time'),
      },
    ];
    setOptions(compile(opt));
  }, []);

  const valueChangeHandler = (val) => {
    setValue(val?.target?.value ?? val);
    field.value = { type, value: val?.target?.value ?? val };
  };

  const typeChangeHandler = (val) => {
    setType(val);
    field.value = { type: val, value };
  };

  return (
    <Space>
      <Select defaultValue={type} value={type} style={{ width: 120 }} onChange={typeChangeHandler}>
        <Select.Option value={AssignedFieldValueType.ConstantValue}>{t('Constant value')}</Select.Option>
        <Select.Option value={AssignedFieldValueType.DynamicValue}>{t('Dynamic value')}</Select.Option>
      </Select>

      {type === AssignedFieldValueType.ConstantValue ? (
        <CollectionField {...props} value={value} onChange={valueChangeHandler} />
      ) : (
        <Cascader
          fieldNames={{
            label: 'title',
            value: 'name',
            children: 'children',
          }}
          style={{
            width: 150,
          }}
          options={options}
          onChange={valueChangeHandler}
          defaultValue={value}
        />
      )}
    </Space>
  );
};
