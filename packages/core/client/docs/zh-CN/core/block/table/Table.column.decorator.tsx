import { useField, useFieldSchema } from '@formily/react';
import { useCollection, useCollectionManager, useCompile, useSchemaToolbarRender } from '@nocobase/client';
import React, { useLayoutEffect } from 'react';
import { isCollectionFieldComponent } from './Table.useProps';

export const useColumnSchema = () => {
  const { getField } = useCollection();
  const compile = useCompile();
  const columnSchema = useFieldSchema();
  const { getCollectionJoinField } = useCollectionManager();
  const fieldSchema = columnSchema.reduceProperties((buf, s) => {
    if (isCollectionFieldComponent(s)) {
      return s;
    }
    return buf;
  }, null);
  if (!fieldSchema) {
    return {};
  }

  const collectionField = getField(fieldSchema.name) || getCollectionJoinField(fieldSchema?.['x-collection-field']);
  return { columnSchema, fieldSchema, collectionField, uiSchema: compile(collectionField?.uiSchema) };
};

export const TableColumnDecorator = () => {
  const field = useField();
  const { fieldSchema, uiSchema } = useColumnSchema();
  const { render } = useSchemaToolbarRender(fieldSchema);
  const compile = useCompile();
  useLayoutEffect(() => {
    if (field.title) {
      return;
    }
    if (!fieldSchema) {
      return;
    }
    if (uiSchema?.title) {
      field.title = uiSchema?.title;
    }
  }, [field, fieldSchema, uiSchema?.title]);
  return (
    <>
      {render()}
      <div role="button">{field?.title || compile(uiSchema?.title)}</div>
    </>
  );
};
