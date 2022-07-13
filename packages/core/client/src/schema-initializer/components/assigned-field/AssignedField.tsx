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

const DYNAMIC_RECORD_REG = /\{\{\s*currentRecord\.(.*)\s*\}\}/;
const DYNAMIC_USER_REG = /\{\{\s*currentUser\.(.*)\s*\}\}/;
const DYNAMIC_TIME_REG = /\{\{\s*currentTime\s*\}\}/;

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
  const isDynamicValue =
    DYNAMIC_RECORD_REG.test(field.value) || DYNAMIC_USER_REG.test(field.value) || DYNAMIC_TIME_REG.test(field.value);
  const initType = isDynamicValue ? AssignedFieldValueType.DynamicValue : AssignedFieldValueType.ConstantValue;
  const [type, setType] = useState<string>(initType);
  const initFieldType = {
    [`${DYNAMIC_TIME_REG.test(field.value)}`]: 'currentTime',
    [`${DYNAMIC_USER_REG.test(field.value)}`]: 'currentUser',
    [`${DYNAMIC_RECORD_REG.test(field.value)}`]: 'currentRecord',
  };
  const [fieldType, setFieldType] = useState<string>(initFieldType['true']);
  const initRecordValue = DYNAMIC_RECORD_REG.exec(field.value)?.[1]?.split('.') ?? [];
  const [recordValue, setRecordValue] = useState<any>(initRecordValue);
  const initUserValue = DYNAMIC_USER_REG.exec(field.value)?.[1]?.split('.') ?? [];
  const [userValue, setUserValue] = useState<any>(initUserValue);
  const initValue = isDynamicValue ? '' : field.value;
  const [value, setValue] = useState(initValue);
  const [options, setOptions] = useState<any[]>([]);
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const fields = useCollectionFilterOptions(collectionField?.collectionName);
  const userFields = useCollectionFilterOptions('users');
  const dateTimeFields = ['createdAt', 'datetime', 'time', 'updatedAt'];
  useEffect(() => {
    const opt = [
      {
        name: 'currentRecord',
        title: t('Current record'),
      },
      {
        name: 'currentUser',
        title: t('Current user'),
      },
    ];
    if (dateTimeFields.includes(collectionField.interface)) {
      opt.unshift({
        name: 'currentTime',
        title: t('Current time'),
      });
    } else {
    }
    setOptions(compile(opt));
  }, []);

  useEffect(() => {
    if (type === AssignedFieldValueType.ConstantValue) {
      field.value = value;
    } else {
      if (fieldType === 'currentTime') {
        field.value = '{{currentTime}}';
      } else if (fieldType === 'currentUser') {
        userValue?.length > 0 && (field.value = `{{currentUser.${userValue.join('.')}}}`);
      } else if (fieldType === 'currentRecord') {
        recordValue?.length > 0 && (field.value = `{{currentRecord.${recordValue.join('.')}}}`);
      }
    }
  }, [type, value, fieldType, userValue, recordValue]);

  useEffect(() => {
    if (type === AssignedFieldValueType.ConstantValue) {
      setFieldType(null);
      setUserValue([]);
      setRecordValue([]);
    }
  }, [type]);

  const typeChangeHandler = (val) => {
    setType(val);
  };

  const valueChangeHandler = (val) => {
    setValue(val?.target?.value ?? val);
  };

  const fieldTypeChangeHandler = (val) => {
    setFieldType(val);
  };
  const recordChangeHandler = (val) => {
    setRecordValue(val);
  };
  const userChangeHandler = (val) => {
    setUserValue(val);
  };
  return (
    <Space>
      <Select defaultValue={type} value={type} style={{ width: 150 }} onChange={typeChangeHandler}>
        <Select.Option value={AssignedFieldValueType.ConstantValue}>{t('Constant value')}</Select.Option>
        <Select.Option value={AssignedFieldValueType.DynamicValue}>{t('Dynamic value')}</Select.Option>
      </Select>

      {type === AssignedFieldValueType.ConstantValue ? (
        <CollectionField {...props} value={value} onChange={valueChangeHandler} style={{ minWidth: 150 }} />
      ) : (
        <Select defaultValue={fieldType} value={fieldType} style={{ minWidth: 150 }} onChange={fieldTypeChangeHandler}>
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
            minWidth: 150,
          }}
          options={compile(fields)}
          onChange={recordChangeHandler}
          defaultValue={recordValue}
        />
      )}
      {fieldType === 'currentUser' && (
        <Cascader
          fieldNames={{
            label: 'title',
            value: 'name',
            children: 'children',
          }}
          style={{
            minWidth: 150,
          }}
          options={compile(userFields)}
          onChange={userChangeHandler}
          defaultValue={userValue}
        />
      )}
    </Space>
  );
};
