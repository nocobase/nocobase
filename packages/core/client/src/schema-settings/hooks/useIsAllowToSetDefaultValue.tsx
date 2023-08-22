import { Form } from '@formily/core';
import { Schema, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { CollectionFieldOptions, useCollection, useCollectionManager, useFormBlockContext, useRecord } from '../..';
import { isPatternDisabled, isSystemField } from '../SchemaSettings';

interface IsAllowToSetDefaultValueParams {
  collectionField: CollectionFieldOptions;
  getInterface: (name: string) => any;
  form: Form;
  fieldSchema: Schema<any, any, any, any, any, any, any, any, any>;
  /**
   * `useRecord` 返回的值
   */
  record: Record<string, any>;
  isSubTableColumn?: boolean;
}

interface Props {
  form?: Form;
  fieldSchema?: Schema<any, any, any, any, any, any, any, any, any>;
  collectionField?: CollectionFieldOptions;
  record?: Record<string, any>;
}

const useIsAllowToSetDefaultValue = ({ form, fieldSchema, collectionField, record }: Props = {}) => {
  const { getInterface, getCollectionJoinField } = useCollectionManager();
  const { getField } = useCollection();
  const { form: innerForm } = useFormBlockContext();
  const innerFieldSchema = useFieldSchema();
  const innerRecord = useRecord();

  const innerCollectionField =
    getField(innerFieldSchema['name']) || getCollectionJoinField(innerFieldSchema['x-collection-field']);

  return {
    isAllowToSetDefaultValue: (isSubTableColumn?: boolean) => {
      return isAllowToSetDefaultValue({
        collectionField: collectionField || innerCollectionField,
        getInterface,
        form: form || innerForm,
        fieldSchema: fieldSchema || innerFieldSchema,
        record: record || innerRecord,
        isSubTableColumn,
      });
    },
  };
};

export default useIsAllowToSetDefaultValue;

function isAllowToSetDefaultValue({
  collectionField,
  getInterface,
  form,
  fieldSchema,
  record,
  isSubTableColumn,
}: IsAllowToSetDefaultValueParams) {
  if (isSubTableColumn) {
    return (
      ![
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
      ].includes(collectionField?.interface) && !isSystemField(collectionField, getInterface)
    );
  }

  record = _.omit(record, '__parent');

  // 表单编辑状态下，不允许设置默认值
  if (!_.isEmpty(record)) {
    return false;
  }

  return (
    !form?.readPretty &&
    !isPatternDisabled(fieldSchema) &&
    ![
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
    ].includes(collectionField?.interface) &&
    !isSystemField(collectionField, getInterface)
  );
}
