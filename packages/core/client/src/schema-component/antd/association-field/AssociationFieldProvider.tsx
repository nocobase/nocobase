/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { observer, useField, useFieldSchema, SchemaOptionsContext } from '@formily/react';
import _ from 'lodash';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useAPIClient, useRequest } from '../../../api-client';
import { useCollectionManager } from '../../../data-source/collection';
import { markRecordAsNew } from '../../../data-source/collection-record/isNewRecord';
import { getDataSourceHeaders } from '../../../data-source/utils';
import { useKeepAlive } from '../../../route-switch/antd/admin-layout/KeepAlive';
import { useSchemaComponentContext } from '../../hooks';
import { AssociationFieldContext } from './context';
import { FormItem, useSchemaOptionsContext } from '../../../schema-component';
import { useCollectionRecord } from '../../../data-source';

export const AssociationFieldProvider = observer(
  (props) => {
    const field = useField<Field>();
    const cm = useCollectionManager();
    const fieldSchema = useFieldSchema();
    const api = useAPIClient();
    const option = useSchemaOptionsContext();
    const rootRef = useRef<HTMLDivElement>(null);
    const record = useCollectionRecord();

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
      () => fieldSchema['x-component-props']?.mode || (isFileCollection ? 'FileManager' : 'Select'),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [fieldSchema['x-component-props']?.mode],
    );

    const [loading, setLoading] = useState(!field.readPretty);

    const { loading: rLoading, run } = useRequest(
      () => {
        const targetKey = collectionField.targetKey;
        if (!fieldSchema.default) {
          return Promise.reject(null);
        }
        if (!['Picker', 'Select'].includes(currentMode)) {
          return Promise.reject(null);
        }
        if (!_.isObject(fieldSchema.default)) {
          return Promise.reject(null);
        }
        const ids = Array.isArray(fieldSchema.default)
          ? fieldSchema.default.map((item) => item[targetKey])
          : fieldSchema.default[targetKey];
        if (_.isUndefined(ids) || _.isNil(ids) || _.isNaN(ids)) {
          return Promise.reject(null);
        }
        if (record && !record.isNew) {
          return Promise.reject(null);
        }
        return api.request({
          resource: collectionField.target,
          action: Array.isArray(ids) ? 'list' : 'get',
          headers: getDataSourceHeaders(cm?.dataSource?.key),
          params: {
            filter: {
              [targetKey]: ids,
            },
          },
        });
      },
      {
        manual: true,
        onSuccess(res) {
          field.initialValue = res?.data?.data;
          // field.value = res?.data?.data;
        },
      },
    );

    const { active } = useKeepAlive();

    useEffect(() => {
      if (!active) {
        return;
      }

      setLoading(true);
      if (!collectionField) {
        setLoading(false);
        return;
      }
      // TODO：这个判断不严谨
      if (['Picker', 'Select'].includes(currentMode) && fieldSchema.default) {
        run();
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
            ['belongsToMany', 'hasMany', 'belongsToArray'].includes(collectionField.type)
          ) {
            field.value = [markRecordAsNew({})];
          }
        }
        setLoading(false);
        return;
      }
      if (['Nester'].includes(currentMode)) {
        if (['belongsTo', 'hasOne'].includes(collectionField.type)) {
          field.value = {};
        } else if (['belongsToMany', 'hasMany', 'belongsToArray'].includes(collectionField.type)) {
          field.value = [markRecordAsNew({})];
        }
      }
      if (currentMode === 'SubTable') {
        field.value = [];
      }

      setLoading(false);
    }, [currentMode, collectionField, field, active]);

    if (loading || rLoading) {
      return null;
    }
    const components = {
      ...option.components,
      FormItem: (props) => {
        return (
          <FormItem
            {...props}
            getPopupContainer={(triggerNode) => {
              return rootRef.current || document.body;
            }}
          />
        );
      },
    };
    return collectionField ? (
      <div ref={rootRef}>
        <AssociationFieldContext.Provider
          value={{ options: collectionField, field, fieldSchema, allowMultiple, allowDissociate, currentMode }}
        >
          <SchemaOptionsContext.Provider
            value={{
              components,
              scope: option.scope,
            }}
          >
            {props.children}
          </SchemaOptionsContext.Provider>
        </AssociationFieldContext.Provider>
      </div>
    ) : null;
  },
  { displayName: 'AssociationFieldProvider' },
);
