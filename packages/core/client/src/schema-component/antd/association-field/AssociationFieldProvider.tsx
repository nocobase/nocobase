/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useCollectionManager } from '../../../data-source/collection';
import { markRecordAsNew } from '../../../data-source/collection-record/isNewRecord';
import { useSchemaComponentContext } from '../../hooks';
import { AssociationFieldContext } from './context';
import { re } from 'mathjs';

export const AssociationFieldProvider = observer(
  (props) => {
    const field = useField<Field>();
    const cm = useCollectionManager();
    const fieldSchema = useFieldSchema();

    // 这里有点奇怪，在 Table 切换显示的组件时，这个组件并不会触发重新渲染，所以增加这个 Hooks 让其重新渲染
    useSchemaComponentContext();

    const allowMultiple = fieldSchema['x-component-props']?.multiple !== false;
    const allowDissociate = fieldSchema['x-component-props']?.allowDissociate !== false;

    const collectionField = useMemo(
      () => cm.getCollectionField(fieldSchema['x-collection-field']),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [fieldSchema['x-collection-field'], fieldSchema.name],
    );
    const isFileCollection = useMemo(
      () => cm.getCollection(collectionField?.target)?.template === 'file',
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [fieldSchema['x-collection-field']],
    );
    const currentMode = useMemo(
      () => {
        if (isFileCollection) {
          return 'FileManager';
        }
        if (!fieldSchema['x-read-pretty'] && ['JSONDocObject', 'JSONDocArray'].includes(collectionField?.interface)) {
          return 'Nester';
        }
        return fieldSchema['x-component-props']?.mode || 'Select';
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [fieldSchema['x-component-props']?.mode, collectionField?.interface],
    );

    const fieldValue = useMemo(() => JSON.stringify(field.value), [field.value]);

    const [loading, setLoading] = useState(!field.readPretty);

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
          if (
            field.value.length === 0 &&
            (['belongsToMany', 'hasMany', 'belongsToArray'].includes(collectionField.type) ||
              ['JSONDocArray'].includes(collectionField.interface))
          ) {
            field.value = [markRecordAsNew({})];
          }
        }
        setLoading(false);
        return;
      }
      if (['Nester'].includes(currentMode)) {
        if (
          ['belongsTo', 'hasOne'].includes(collectionField.type) ||
          ['JSONDocObject'].includes(collectionField.interface)
        ) {
          field.value = {};
        } else if (
          ['belongsToMany', 'hasMany', 'belongsToArray'].includes(collectionField.type) ||
          ['JSONDocArray'].includes(collectionField.interface)
        ) {
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
