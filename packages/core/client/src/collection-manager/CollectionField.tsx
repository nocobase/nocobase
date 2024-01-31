import { Field } from '@formily/core';
import { connect, useField, useFieldSchema } from '@formily/react';
import { merge } from '@formily/shared';
import { concat } from 'lodash';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useActionContext, useCompile, useComponent, useFormBlockContext, useRecord } from '..';
import useIsAllowToSetDefaultValue from '../schema-settings/hooks/useIsAllowToSetDefaultValue';
import { CollectionFieldProvider } from './CollectionFieldProvider';
import { useCollectionField } from './hooks';

type Props = {
  component: any;
  children?: React.ReactNode;
};

// TODO: 初步适配
const InternalField: React.FC = (props: Props) => {
  const { component } = props;
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { uiSchema, defaultValue } = useCollectionField();
  const { isAllowToSetDefaultValue } = useIsAllowToSetDefaultValue();
  const Component = useComponent(component || uiSchema?.['x-component'] || 'Input');
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
  // TODO: 初步适配
  useEffect(() => {
    if (!uiSchema) {
      return;
    }
    setFieldProps('content', uiSchema['x-content']);
    setFieldProps('title', uiSchema.title);
    setFieldProps('description', uiSchema.description);
    if (ctx?.form) {
      const defaultVal = isAllowToSetDefaultValue() ? fieldSchema.default || defaultValue : undefined;
      defaultVal !== null && defaultVal !== undefined && setFieldProps('initialValue', defaultVal);
    }
    if (!field.validator && (uiSchema['x-validator'] || fieldSchema['x-validator'])) {
      const concatSchema = concat([], uiSchema['x-validator'] || [], fieldSchema['x-validator'] || []);
      field.validator = concatSchema;
    }
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
    field.component = [Component, componentProps];
  }, [JSON.stringify(uiSchema)]);
  if (!uiSchema) {
    return null;
  }
  return <Component {...props} />;
};

export const InternalFallbackField = () => {
  const { uiSchema } = useCollectionField();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const record = useRecord();

  const displayKey = fieldSchema['x-component-props']?.fieldNames?.label ?? 'id';

  const value = record[fieldSchema.name];

  useEffect(() => {
    field.title = fieldSchema.title ?? fieldSchema.name;
  }, [uiSchema?.title]);

  let displayText = value;

  if (Array.isArray(value) || typeof value === 'object') {
    displayText = []
      .concat(value)
      .map((i) => i[displayKey])
      .join(', ');
  }

  return <div>{displayText}</div>;
};

// 当字段被删除时，显示一个提示占位符
const DeletedField = () => {
  const { t } = useTranslation();
  return <div style={{ color: '#ccc' }}>{t('The field has been deleted')}</div>;
};

export const CollectionField = connect((props) => {
  const fieldSchema = useFieldSchema();
  const field = fieldSchema?.['x-component-props']?.['field'];
  const { snapshot } = useActionContext();
  return (
    <CollectionFieldProvider
      name={fieldSchema.name}
      field={field}
      fallback={snapshot ? <InternalFallbackField /> : <DeletedField />}
    >
      <InternalField {...props} />
    </CollectionFieldProvider>
  );
});

export default CollectionField;
