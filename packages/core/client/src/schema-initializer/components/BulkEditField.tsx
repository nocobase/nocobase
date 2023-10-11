import { css } from '@emotion/css';
import { Field } from '@formily/core';
import { connect, useField, useFieldSchema } from '@formily/react';
import { merge, uid } from '@formily/shared';
import { Checkbox, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../block-provider';
import { CollectionFieldProvider, useCollection, useCollectionField } from '../../collection-manager';
import { useCompile, useComponent } from '../../schema-component';
import { DeletedField } from './DeletedField';

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
    setFieldProps('description', uiSchema.description);
    setFieldProps('initialValue', uiSchema.default);
    // if (!field.validator && uiSchema['x-validator']) {
    //   field.validator = uiSchema['x-validator'];
    // }
    if (fieldSchema['x-disabled'] === true) {
      field.disabled = true;
    }
    if (fieldSchema['x-read-pretty'] === true) {
      field.readPretty = true;
    }
    setRequired();
    // @ts-ignore
    field.dataSource = uiSchema.enum;
    const originalProps = compile(uiSchema['x-component-props']) || {};
    const componentProps = merge(originalProps, field.componentProps || {});
    field.componentProps = componentProps;
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
    <CollectionFieldProvider name={fieldSchema.name} fallback={<DeletedField />}>
      <InternalField {...props} />
    </CollectionFieldProvider>
  );
});

export enum BulkEditFormItemValueType {
  RemainsTheSame = 1,
  ChangedTo,
  Clear,
  AddAttach,
}

export const BulkEditField = (props: any) => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const field = useField<Field>();
  const [type, setType] = useState<number>(BulkEditFormItemValueType.RemainsTheSame);
  const [value, setValue] = useState(null);
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name) || {};

  useEffect(() => {
    field.value = { [type]: value };
  }, [type, value]);

  const typeChangeHandler = (val) => {
    setType(val);
  };

  const valueChangeHandler = (val) => {
    setValue(val?.target?.value ?? val?.target?.checked ?? val);
  };

  const collectionSchema: any = {
    type: 'void',
    properties: {
      [uid()]: {
        type: 'string',
        'x-component': 'BulkEditCollectionField',
        'x-collection-field': fieldSchema['x-collection-field'],
        'x-component-props': {
          ...props,
          value,
          onChange: valueChangeHandler,
          style: { minWidth: 150 },
        },
        'x-decorator': 'FormItem',
      },
    },
  };

  return (
    <Space
      className={css`
        display: flex;
        > .ant-space-item {
          width: 100%;
        }
      `}
    >
      <Select data-testid="antd-select" defaultValue={type} value={type} onChange={typeChangeHandler}>
        <Select.Option value={BulkEditFormItemValueType.RemainsTheSame}>{t('Remains the same')}</Select.Option>
        <Select.Option value={BulkEditFormItemValueType.ChangedTo}>{t('Changed to')}</Select.Option>
        <Select.Option value={BulkEditFormItemValueType.Clear}>{t('Clear')}</Select.Option>
        {['subTable', 'linkTo', 'm2m', 'o2m', 'o2o', 'oho', 'obo', 'm2o'].includes(collectionField?.interface) && (
          <Select.Option value={BulkEditFormItemValueType.AddAttach}>{t('Add attach')}</Select.Option>
        )}
      </Select>
      {/* XXX: Not a best practice */}
      {[BulkEditFormItemValueType.ChangedTo, BulkEditFormItemValueType.AddAttach].includes(type) &&
        collectionField?.interface !== 'checkbox' && (
          <CollectionField {...props} value={value} onChange={valueChangeHandler} style={{ minWidth: 150 }} />
          // <SchemaComponent
          //   schema={collectionSchema}
          //   components={{ BulkEditCollectionField: CollectionField }}
          //   onlyRenderProperties
          // />
        )}
      {[BulkEditFormItemValueType.ChangedTo, BulkEditFormItemValueType.AddAttach].includes(type) &&
        collectionField?.interface === 'checkbox' && <Checkbox checked={value} onChange={valueChangeHandler} />}
    </Space>
  );
};
