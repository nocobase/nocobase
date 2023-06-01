import { Field } from '@formily/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useCollectionManager } from '../../../collection-manager';
import { AssociationFieldContext } from './context';

export const AssociationFieldProvider = observer((props) => {
  const field = useField<Field>();
  const { getCollectionJoinField, getCollection } = useCollectionManager();
  const fieldSchema = useFieldSchema();
  const allowMultiple = fieldSchema['x-component-props']?.multiple !== false;
  const allowDissociate = fieldSchema['x-component-props']?.allowDissociate !== false;

  const collectionField = useMemo(
    () => getCollectionJoinField(fieldSchema['x-collection-field']),
    [fieldSchema['x-collection-field'], fieldSchema.name],
  );
  const isFileCollection = useMemo(
    () => getCollection(collectionField?.target)?.template === 'file',
    [fieldSchema['x-collection-field']],
  );
  const currentMode = useMemo(
    () => fieldSchema['x-component-props']?.mode || (isFileCollection ? 'FileManager' : 'Select'),
    [fieldSchema['x-component-props']?.mode],
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!collectionField) {
      setLoading(false);
      return;
    }
    if (field.value !== null && field.value !== undefined) {
      // Nester 子表单时，如果没数据初始化一个 [null] 的占位
      if (currentMode === 'Nester' && Array.isArray(field.value)) {
        if (field.value.length === 0 && ['belongsToMany', 'hasMany'].includes(collectionField.type)) {
          field.value = [null];
        }
      }
      setLoading(false);
      return;
    }
    if (currentMode === 'Nester') {
      if (['belongsTo', 'hasOne'].includes(collectionField.type)) {
        field.value = {};
      } else if (['belongsToMany', 'hasMany'].includes(collectionField.type)) {
        field.value = [null];
      }
    }
    setLoading(false);
  }, [currentMode, collectionField, field.value]);

  if (loading) {
    return null;
  }

  return collectionField ? (
    <AssociationFieldContext.Provider
      value={{ options: collectionField, field, allowMultiple, allowDissociate, currentMode }}
    >
      {props.children}
    </AssociationFieldContext.Provider>
  ) : null;
});
