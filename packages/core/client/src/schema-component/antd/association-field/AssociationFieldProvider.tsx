import { Field } from '@formily/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useCollectionManager_deprecated } from '../../../collection-manager';
import { AssociationFieldContext } from './context';
import { markRecordAsNew } from '../../../data-source/collection-record/isNewRecord';

export const AssociationFieldProvider = observer(
  (props) => {
    const field = useField<Field>();
    const { getCollectionJoinField, getCollection } = useCollectionManager_deprecated();
    const fieldSchema = useFieldSchema();
    const allowMultiple = fieldSchema['x-component-props']?.multiple !== false;
    const allowDissociate = fieldSchema['x-component-props']?.allowDissociate !== false;

    const collectionField = useMemo(
      () => getCollectionJoinField(fieldSchema['x-collection-field']),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [fieldSchema['x-collection-field'], fieldSchema.name],
    );
    const isFileCollection = useMemo(
      () => getCollection(collectionField?.target)?.template === 'file',
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [fieldSchema['x-collection-field']],
    );
    const currentMode = useMemo(
      () => fieldSchema['x-component-props']?.mode || (isFileCollection ? 'FileManager' : 'Select'),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [fieldSchema['x-component-props']?.mode],
    );

    const fieldValue = useMemo(() => JSON.stringify(field.value), [field.value]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
      setLoading(true);
      if (!collectionField) {
        setLoading(false);
        return;
      }
      // 如果是表单模板数据，使用子表单和子表格组件时，过滤掉关系 ID
      if (field.value && field.form['__template'] && ['Nester', 'SubTable', 'PopoverNester'].includes(currentMode)) {
        if (['belongsTo', 'hasOne'].includes(collectionField.type)) {
          if (field.value?.[collectionField.targetKey]) {
            delete field.value[collectionField.targetKey];
          }
          field.value = { ...field.initialValue, ...field.value };
        } else if (['belongsToMany', 'hasMany'].includes(collectionField.type)) {
          if (Array.isArray(field.value)) {
            field.value = field.value.map((v) => {
              delete v[collectionField.targetKey];
              return { ...field.initialValue?.[0], ...v };
            });
          }
        }
      }
      if (field.value !== null && field.value !== undefined) {
        // Nester 子表单时，如果没数据初始化一个 [{}] 的占位
        if (['Nester', 'PopoverNester'].includes(currentMode) && Array.isArray(field.value)) {
          if (field.value.length === 0 && ['belongsToMany', 'hasMany'].includes(collectionField.type)) {
            field.value = [markRecordAsNew({})];
          }
        }
        setLoading(false);
        return;
      }
      if (['Nester'].includes(currentMode)) {
        if (['belongsTo', 'hasOne'].includes(collectionField.type)) {
          field.value = {};
        } else if (['belongsToMany', 'hasMany'].includes(collectionField.type)) {
          field.value = [markRecordAsNew({})];
        }
      }
      if (currentMode === 'SubTable') {
        field.value = [];
      }
      setLoading(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentMode, collectionField, fieldValue]);

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
