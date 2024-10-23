/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form } from '@formily/core';
import { Schema, useFieldSchema } from '@formily/react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useFormBlockContext, useFormBlockType } from '../../block-provider/FormBlockProvider';
import { CollectionFieldOptions_deprecated } from '../../collection-manager/types';
import { useCollectionManager } from '../../data-source/collection/CollectionManagerProvider';
import { useCollection } from '../../data-source/collection/CollectionProvider';
import { useDataSourceManager } from '../../data-source/data-source/DataSourceManagerProvider';
import { isSystemField } from '../SchemaSettings';
import { isPatternDisabled } from '../isPatternDisabled';

interface DefaultValueProviderProps {
  isAllowToSetDefaultValue: (params: IsAllowToSetDefaultValueParams) => boolean;
  children: React.ReactNode;
}

export interface IsAllowToSetDefaultValueParams {
  collectionField: CollectionFieldOptions_deprecated;
  getInterface: (name: string) => any;
  formBlockType?: 'update' | 'create';
  form: Form;
  fieldSchema: Schema<any, any, any, any, any, any, any, any, any>;
  isSubTableColumn?: boolean;
}

interface Props {
  form?: Form;
  fieldSchema?: Schema<any, any, any, any, any, any, any, any, any>;
  collectionField?: CollectionFieldOptions_deprecated;
}

const DefaultValueContext = React.createContext<Omit<DefaultValueProviderProps, 'children'>>(null);

export const DefaultValueProvider = (props: DefaultValueProviderProps) => {
  const value = useMemo(() => {
    return {
      isAllowToSetDefaultValue: props.isAllowToSetDefaultValue,
    };
  }, [props.isAllowToSetDefaultValue]);

  return <DefaultValueContext.Provider value={value}>{props.children}</DefaultValueContext.Provider>;
};

export const useIsAllowToSetDefaultValue = ({ form, fieldSchema, collectionField }: Props = {}) => {
  const dm = useDataSourceManager();
  const cm = useCollectionManager();
  const collection = useCollection();
  const { form: innerForm } = useFormBlockContext();
  const innerFieldSchema = useFieldSchema();
  const { type } = useFormBlockType();
  const { isAllowToSetDefaultValue = _isAllowToSetDefaultValue } = useContext(DefaultValueContext) || {};

  const result = {
    isAllowToSetDefaultValue: useCallback(
      (isSubTableColumn?: boolean) => {
        const innerCollectionField =
          collection.getField(innerFieldSchema['name']) ||
          cm.getCollectionField(innerFieldSchema['x-collection-field']);

        return isAllowToSetDefaultValue({
          collectionField: collectionField || innerCollectionField,
          getInterface: dm?.collectionFieldInterfaceManager.getFieldInterface.bind(dm?.collectionFieldInterfaceManager),
          form: form || innerForm,
          formBlockType: type,
          fieldSchema: fieldSchema || innerFieldSchema,
          isSubTableColumn,
        });
      },
      [
        cm,
        collection,
        collectionField,
        dm?.collectionFieldInterfaceManager,
        fieldSchema,
        form,
        innerFieldSchema,
        innerForm,
        isAllowToSetDefaultValue,
        type,
      ],
    ),
  };
  return result;
};

export const interfacesOfUnsupportedDefaultValue = [
  'o2o',
  'oho',
  'obo',
  'o2m',
  'attachment',
  'expression',
  'point',
  'lineString',
  'circle',
  'polygon',
  'sequence',
  'formula',
];

function _isAllowToSetDefaultValue({
  collectionField,
  getInterface,
  formBlockType,
  form,
  fieldSchema,
  isSubTableColumn,
}: IsAllowToSetDefaultValueParams) {
  if (isSubTableColumn) {
    return (
      !interfacesOfUnsupportedDefaultValue.includes(collectionField?.interface) &&
      !isSystemField(collectionField, getInterface)
    );
  }

  if (!collectionField) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`collectionField should not be ${collectionField}`);
    }
    return false;
  }

  // 当 Field component 不是下列组件时，不允许设置默认值
  if (
    collectionField.target &&
    fieldSchema['x-component-props']?.mode &&
    !['Picker', 'Select'].includes(fieldSchema['x-component-props'].mode)
  ) {
    return false;
  }
  // 表单非新建状态下，不允许设置默认值
  if (formBlockType !== 'create') {
    return false;
  }
  return (
    !form?.readPretty &&
    !isPatternDisabled(fieldSchema) &&
    !interfacesOfUnsupportedDefaultValue.includes(collectionField?.interface) &&
    !isSystemField(collectionField, getInterface)
  );
}
