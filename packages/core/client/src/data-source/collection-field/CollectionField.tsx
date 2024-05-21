/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { connect, useField, useFieldSchema } from '@formily/react';
import { merge } from '@formily/shared';
import { concat } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useFormBlockContext } from '../../block-provider/FormBlockProvider';
import { useDynamicComponentProps } from '../../hoc/withDynamicSchemaProps';
import { useCompile, useComponent } from '../../schema-component';
import { useIsAllowToSetDefaultValue } from '../../schema-settings/hooks/useIsAllowToSetDefaultValue';
import { CollectionFieldProvider, useCollectionField } from './CollectionFieldProvider';

type Props = {
  component: any;
  children?: React.ReactNode;
};

/**
 * TODO: 初步适配
 * @internal
 */
export const CollectionFieldInternalField: React.FC = (props: Props) => {
  const { component } = props;
  const compile = useCompile();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const collectionField = useCollectionField();
  const { uiSchema: uiSchemaOrigin, defaultValue } = collectionField;
  const { isAllowToSetDefaultValue } = useIsAllowToSetDefaultValue();
  const uiSchema = useMemo(() => compile(uiSchemaOrigin), [JSON.stringify(uiSchemaOrigin)]);
  const Component = useComponent(component || uiSchema?.['x-component'] || 'Input');
  const setFieldProps = useCallback(
    (key, value) => {
      field[key] = typeof field[key] === 'undefined' ? value : field[key];
    },
    [field],
  );
  const setRequired = useCallback(() => {
    if (typeof fieldSchema['required'] === 'undefined') {
      field.required = !!uiSchema['required'];
    }
  }, [fieldSchema, uiSchema]);
  const ctx = useFormBlockContext();

  const dynamicProps = useDynamicComponentProps(uiSchema?.['x-use-component-props'], props);

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
    field.componentProps = merge(originalProps, field.componentProps || {}, dynamicProps || {});
  }, [uiSchema]);

  if (!uiSchema) return null;

  return <Component {...props} {...dynamicProps} />;
};

export const CollectionField = connect((props) => {
  const fieldSchema = useFieldSchema();
  return (
    <CollectionFieldProvider name={fieldSchema.name}>
      <CollectionFieldInternalField {...props} />
    </CollectionFieldProvider>
  );
});

CollectionField.displayName = 'CollectionField';
