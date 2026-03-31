/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { connect, Schema, useField, useFieldSchema } from '@formily/react';
import { untracked } from '@formily/reactive';
import { merge } from '@formily/shared';
import { concat } from 'lodash';
import React, { useEffect } from 'react';
import { useFormBlockContext } from '../../block-provider/FormBlockProvider';
import { useCollectionFieldUISchema, useIsInNocoBaseRecursionFieldContext } from '../../formily/NocoBaseRecursionField';
import { useDynamicComponentProps } from '../../hoc/withDynamicSchemaProps';
import { useCompile, useComponent } from '../../schema-component';
import { useIsAllowToSetDefaultValue } from '../../schema-settings/hooks/useIsAllowToSetDefaultValue';
import { isVariable } from '../../variables/utils/isVariable';
import { CollectionFieldProvider, useCollectionField } from './CollectionFieldProvider';

type Props = {
  component: any;
  children?: React.ReactNode;
};

const setFieldProps = (field: Field, key: string, value: any) => {
  untracked(() => {
    if (field[key] === undefined) {
      field[key] = value;
    }
  });
};

const setRequired = (field: Field, fieldSchema: Schema, uiSchema: Schema) => {
  if (typeof fieldSchema['required'] === 'undefined') {
    field.required = !!uiSchema['required'];
  }
};

/**
 * @deprecated
 * Used to handle scenarios that use RecursionField, such as various plugin configuration pages
 * @internal
 */
const CollectionFieldInternalField_deprecated: React.FC = (props: Props) => {
  const compile = useCompile();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { uiSchema: uiSchemaOrigin, defaultValue } = useCollectionField();
  const { isAllowToSetDefaultValue } = useIsAllowToSetDefaultValue();
  const Component = useComponent(
    fieldSchema['x-component-props']?.['component'] || uiSchemaOrigin?.['x-component'] || 'Input',
  );
  const ctx = useFormBlockContext();
  const dynamicProps = useDynamicComponentProps(uiSchemaOrigin?.['x-use-component-props'], props);

  // TODO: 初步适配
  useEffect(() => {
    if (!uiSchemaOrigin) {
      return;
    }
    const uiSchema = compile(uiSchemaOrigin);
    setFieldProps(field, 'content', uiSchema['x-content']);
    setFieldProps(field, 'title', uiSchema.title);
    setFieldProps(field, 'description', uiSchema.description);
    if (ctx?.form) {
      const defaultVal = isAllowToSetDefaultValue() ? fieldSchema.default || defaultValue : undefined;
      defaultVal !== null && defaultVal !== undefined && setFieldProps(field, 'initialValue', defaultVal);
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
    setRequired(field, fieldSchema, uiSchema);
    // @ts-ignore
    field.dataSource = uiSchema.enum;
    field.data = field.data || {};
    field.data.dataSource = uiSchema?.enum;
    const originalProps = compile(uiSchema['x-component-props']) || {};
    field.componentProps = merge(originalProps, field.componentProps || {}, dynamicProps || {});
  }, [uiSchemaOrigin]);

  if (!uiSchemaOrigin) return null;

  return <Component {...props} {...dynamicProps} />;
};

const CollectionFieldInternalField = (props) => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { uiSchema } = useCollectionFieldUISchema();
  const Component = useComponent(
    fieldSchema['x-component-props']?.['component'] || uiSchema?.['x-component'] || 'Input',
  );
  const dynamicProps = useDynamicComponentProps(uiSchema?.['x-use-component-props'], props);

  useEffect(() => {
    /**
     * There seems to be a bug in formily where after setting a field to readPretty, switching to editable,
     * then back to readPretty, and refreshing the page, the field remains in editable state. The expected state is readPretty.
     * This code is meant to fix this issue.
     */
    if (fieldSchema['x-read-pretty'] === true && !field.readPretty) {
      field.readPretty = true;
    }

    /**
     * This solves the issue: After creating a form and setting a field to "read-only", the field remains editable when refreshing the page and reopening the dialog.
     *
     * Note: This might be a bug in Formily
     * When both x-disabled and x-read-pretty exist in the Schema:
     * - If x-disabled appears before x-read-pretty in the Schema JSON, the disabled state becomes ineffective
     * - The reason is that during field instance initialization, field.disabled is set before field.readPretty, which causes the pattern value to be changed to 'editable'
     * - This issue is related to the order of JSON fields, which might return different orders in different environments (databases), thus making the issue inconsistent to reproduce
     *
     * Reference to Formily source code:
     * 1. Setting readPretty may cause pattern to be changed to 'editable': https://github.com/alibaba/formily/blob/d4bb96c40e7918210b1bd7d57b8fadee0cfe4b26/packages/core/src/models/BaseField.ts#L208-L224
     * 2. The execution order of the each method depends on the order of JSON fields: https://github.com/alibaba/formily/blob/123d536b6076196e00b4e02ee160d72480359f54/packages/json-schema/src/schema.ts#L486-L519
     */
    if (fieldSchema['x-disabled'] === true) {
      field.disabled = true;
    }
    field.data = field.data || {};
    field.data.dataSource = uiSchema?.enum;
  }, [field, fieldSchema]);

  if (!uiSchema) return null;

  const mergedProps = { ...props, ...dynamicProps };

  // Prevent displaying the variable string first, then the variable value
  if (isVariable(mergedProps.value) && mergedProps.value === fieldSchema.default) {
    mergedProps.value = undefined;
  }

  return <Component {...mergedProps} />;
};

export const CollectionField = connect((props) => {
  const fieldSchema = useFieldSchema();
  const isInNocoBaseRecursionField = useIsInNocoBaseRecursionFieldContext();

  return (
    <CollectionFieldProvider name={fieldSchema.name}>
      {isInNocoBaseRecursionField ? (
        <CollectionFieldInternalField {...props} />
      ) : (
        <CollectionFieldInternalField_deprecated {...props} />
      )}
    </CollectionFieldProvider>
  );
});

CollectionField.displayName = 'CollectionField';
