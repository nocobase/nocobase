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
  const [fieldType, setFieldType] = useState<string>(Object.keys(field.value?.value ?? {})?.[0]);
  const [recordValue, setRecordValue] = useState<any>(field.value?.value?.currentRecord ?? []);
  const [value, setValue] = useState(field.value?.value ?? '');
  const [options, setOptions] = useState<any[]>([]);
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const fields = useCollectionFilterOptions(collectionField?.collectionName);
  const dateTimeFields = ['createdAt', 'datetime', 'time', 'updatedAt'];
  useEffect(() => {
    let opt = null;
    if (dateTimeFields.includes(collectionField.interface)) {
      opt = [
        {
          name: 'currentTime',
          title: t('Current time'),
        },
      ];
    } else {
      opt = [
        {
          name: 'currentRecord',
          title: t('Current record'),
        },
        {
          name: 'currentUser',
          title: t('Current user'),
        },
      ];
    }
    setOptions(compile(opt));
  }, []);

  const typeChangeHandler = (val) => {
    setType(val);
    field.value = { type: val, value };
  };

  const valueChangeHandler = (val) => {
    setValue(val?.target?.value ?? val);
    field.value = { type, value: val?.target?.value ?? val };
  };

  const fieldTypeChangeHandler = (val) => {
    setFieldType(val);
    if (val === 'currentTime') {
      field.value = { type, value: { currentTime: '{{currentTime}}' } };
    } else if (val === 'currentUser') {
      field.value = { type, value: { currentUser: '{{currentUser.id}}' } };
    }
  };
  const recordChangeHandler = (val) => {
    setRecordValue(val);
    field.value = { type, value: { currentRecord: val } };
  };
  debugger;
  return (
    <Space>
      <Select defaultValue={type} value={type} style={{ width: 120 }} onChange={typeChangeHandler}>
        <Select.Option value={AssignedFieldValueType.ConstantValue}>{t('Constant value')}</Select.Option>
        <Select.Option value={AssignedFieldValueType.DynamicValue}>{t('Dynamic value')}</Select.Option>
      </Select>

      {type === AssignedFieldValueType.ConstantValue ? (
        <CollectionField {...props} value={value} onChange={valueChangeHandler} />
      ) : (
        <Select defaultValue={fieldType} value={fieldType} style={{ width: 120 }} onChange={fieldTypeChangeHandler}>
          {options?.map((opt) => {
            return (
              <Select.Option key={opt.name} value={opt.name}>
                {opt.title}
              </Select.Option>
            );
          })}
        </Select>
      )}
      {fieldType === 'currentRecord' && (
        <Cascader
          fieldNames={{
            label: 'title',
            value: 'name',
            children: 'children',
          }}
          style={{
            width: 150,
          }}
          options={compile(fields)}
          onChange={recordChangeHandler}
          defaultValue={recordValue}
        />
      )}
    </Space>
  );
};
