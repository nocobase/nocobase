import { Field } from '@formily/core';
import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useCollectionManager } from '../../../collection-manager';
import { AssociationFieldContext } from './context';
import { useRecord } from '../../../record-provider';

export const AssociationFieldProvider = observer(
  (props) => {
    const field = useField<Field>();
    const { getCollectionJoinField, getCollection } = useCollectionManager();
    const fieldSchema = useFieldSchema();
    const allowMultiple = fieldSchema['x-component-props']?.multiple !== false;
    const allowDissociate = fieldSchema['x-component-props']?.allowDissociate !== false;
    const isAddNewForm = Object.keys(useRecord()).length === 0;
    const form: any = useForm();

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
            field.value = [{}];
          }
        }
        setLoading(false);
        return;
      }
      if (currentMode === 'Nester') {
        if (['belongsTo', 'hasOne'].includes(collectionField.type)) {
          field.value = {};
        } else if (['belongsToMany', 'hasMany'].includes(collectionField.type)) {
          field.value = [{}];
        }
      }
      setLoading(false);
    }, [currentMode, collectionField, field.value]);

    useEffect(() => {
      if (isAddNewForm && form.data) {
        // 新建的场景下生效
        if (['Nester', 'SubTable'].includes(currentMode)) {
          if (['belongsToMany', 'hasMany'].includes(collectionField.type)) {
            const data = form.data[fieldSchema.name];
            field.data = data.concat();
            field.value = data.map(({ id, ...obj }) => obj);
          } else {
            const data = form.data[fieldSchema.name];
            field.data = data;
            const { id, ...filteredObj } = data;
            field.value = { ...filteredObj };
          }
        } else {
          const data = field.data;
          field.value = data;
        }
      }
    }, [currentMode, collectionField, form.data]);
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
  },
  { displayName: 'AssociationFieldProvider' },
);
