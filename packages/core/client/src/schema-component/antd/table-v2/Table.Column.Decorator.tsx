/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import React, { useEffect, useMemo } from 'react';
import {
  BlockContext,
  CollectionFieldContext,
  SortableItem,
  useBlockContext,
  useCollection_deprecated,
  useCollectionManager_deprecated,
  useCompile,
  useDesigner,
  useFlag,
  useSchemaComponentContext,
} from '../../../';
import { useToken } from '../__builtins__';
import { designerCss } from './Table.Column.ActionBar';
import { isCollectionFieldComponent } from './utils';

export const useColumnSchema = () => {
  const { getField } = useCollection_deprecated();
  const compile = useCompile();
  const columnSchema = useFieldSchema();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const fieldSchema = columnSchema?.reduceProperties((buf, s) => {
    if (isCollectionFieldComponent(s)) {
      return s;
    }
    return buf;
  }, null);

  if (!fieldSchema) {
    return {};
  }

  const collectionField = getField(fieldSchema.name) || getCollectionJoinField(fieldSchema?.['x-collection-field']);

  return {
    columnSchema,
    fieldSchema,
    collectionField,
    uiSchema: compile(collectionField?.uiSchema),
  };
};

export const useTableFieldInstanceList = () => {
  const columnField = useField();
  const { fieldSchema } = useColumnSchema();
  const filedInstanceList = useMemo(() => {
    if (!fieldSchema || !columnField) {
      return [];
    }

    const path = columnField.path?.splice(columnField.path?.length - 1, 1);
    // TODO: 这里需要优化，性能比较差，在 M2 pro 的机器上这行代码会运行将近 0.1 毫秒
    return columnField.form.query(`${path.concat(`*.` + fieldSchema.name)}`).map();
  }, [columnField, fieldSchema]);

  if (!fieldSchema) {
    return [];
  }

  return filedInstanceList;
};

export const TableColumnDecorator = (props) => {
  const Designer = useDesigner();
  const field = useField();
  const { fieldSchema, uiSchema, collectionField } = useColumnSchema();
  const { designable } = useSchemaComponentContext();
  const compile = useCompile();
  const { isInSubTable } = useFlag() || {};
  const { token } = useToken();
  const { name } = useBlockContext?.() || {};

  let required = fieldSchema?.required;

  if (isInSubTable) {
    const path = field.path?.splice(field.path?.length - 1, 1);
    const realField = field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).take() as Field;
    required = typeof realField?.required === 'boolean' ? realField.required : fieldSchema?.required;
  }

  useEffect(() => {
    if (field.title) {
      return;
    }
    if (!fieldSchema) {
      return;
    }
    if (uiSchema?.title) {
      field.title = uiSchema?.title;
    }
  }, [uiSchema?.title]);

  if (!designable || Designer.isNullComponent) {
    return (
      <CollectionFieldContext.Provider value={collectionField}>
        <Designer fieldSchema={fieldSchema} uiSchema={uiSchema} collectionField={collectionField} />
        <span role="button">
          {required && <span className="ant-formily-item-asterisk">*</span>}
          <span>{field?.title || compile(uiSchema?.title)}</span>
        </span>
      </CollectionFieldContext.Provider>
    );
  }

  return (
    <SortableItem
      className={designerCss({
        margin: `-${token.margin}px -${token.marginXS}px`,
        padding: `${token.margin}px ${token.marginXS}px`,
      })}
    >
      <CollectionFieldContext.Provider value={collectionField}>
        <BlockContext.Provider value={{ name: isInSubTable ? name : 'taleColumn' }}>
          <Designer fieldSchema={fieldSchema} uiSchema={uiSchema} collectionField={collectionField} />
          <span role="button">
            {required && <span className="ant-formily-item-asterisk">*</span>}
            <span>{field?.title || compile(uiSchema?.title)}</span>
          </span>
        </BlockContext.Provider>
      </CollectionFieldContext.Provider>
    </SortableItem>
  );
};
