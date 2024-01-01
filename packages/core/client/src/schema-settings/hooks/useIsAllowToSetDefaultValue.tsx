import { Form } from '@formily/core';
import { Schema, useFieldSchema } from '@formily/react';
import React, { useContext, useMemo } from 'react';
import {
  CollectionFieldOptionsV2,
  CollectionManagerV2,
  useCollectionManagerV2,
  useCollectionV2,
  useFormBlockContext,
  useFormBlockType,
} from '../..';
import { isPatternDisabled, isSystemField } from '../SchemaSettings';

interface DefaultValueProviderProps {
  isAllowToSetDefaultValue: (params: IsAllowToSetDefaultValueParams) => boolean;
  children: React.ReactNode;
}

export interface IsAllowToSetDefaultValueParams {
  collectionManager: CollectionManagerV2;
  collectionField?: CollectionFieldOptionsV2;
  formBlockType?: 'update' | 'create';
  form: Form;
  fieldSchema: Schema<any, any, any, any, any, any, any, any, any>;
  isSubTableColumn?: boolean;
}

interface Props {
  form?: Form;
  fieldSchema?: Schema<any, any, any, any, any, any, any, any, any>;
  collectionField?: CollectionFieldOptionsV2;
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

const useIsAllowToSetDefaultValue = ({ form, fieldSchema, collectionField }: Props = {}) => {
  const cm = useCollectionManagerV2();
  const collection = useCollectionV2();
  const { form: innerForm } = useFormBlockContext();
  const innerFieldSchema = useFieldSchema();
  const { type } = useFormBlockType();
  const { isAllowToSetDefaultValue = _isAllowToSetDefaultValue } = useContext(DefaultValueContext) || {};
  const innerCollectionField =
    collection.getField(innerFieldSchema['name']) || cm.getCollectionField(innerFieldSchema['x-collection-field']);

  return {
    isAllowToSetDefaultValue: (isSubTableColumn?: boolean) => {
      return isAllowToSetDefaultValue({
        collectionField: collectionField || innerCollectionField,
        collectionManager: cm,
        form: form || innerForm,
        formBlockType: type,
        fieldSchema: fieldSchema || innerFieldSchema,
        isSubTableColumn,
      });
    },
  };
};

export default useIsAllowToSetDefaultValue;

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
  collectionManager,
  formBlockType,
  form,
  fieldSchema,
  isSubTableColumn,
}: IsAllowToSetDefaultValueParams) {
  if (isSubTableColumn) {
    return (
      !interfacesOfUnsupportedDefaultValue.includes(collectionField?.interface) &&
      !isSystemField(collectionField, collectionManager)
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
    !isSystemField(collectionField, collectionManager)
  );
}
