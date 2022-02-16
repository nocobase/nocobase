import { useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import React, { useEffect } from 'react';
import { useCollection, useDesignable } from '../../../';

export const useColumnSchema = () => {
  const { getField } = useCollection();
  const columnSchema = useFieldSchema();
  const fieldSchema = columnSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'CollectionField') {
      return s;
    }
    return buf;
  }, null);
  if (!fieldSchema) {
    return;
  }
  const collectionField = getField(fieldSchema.name);
  return { columnSchema, fieldSchema, collectionField };
};

export const TableColumnDecorator = (props) => {
  const field = useField();
  const { columnSchema, fieldSchema, collectionField } = useColumnSchema();
  const { refresh } = useDesignable();
  useEffect(() => {
    if (field.title) {
      return;
    }
    if (!fieldSchema) {
      return;
    }
    if (collectionField?.uiSchema?.title) {
      field.title = collectionField?.uiSchema?.title;
    }
  }, []);
  return (
    <>
      {props.children}
      <div
        onClick={() => {
          field.title = uid();
          columnSchema.title = field.title = field.title;
          refresh();
          field.query(`.*.${fieldSchema.name}`).take((f) => {
            f.componentProps.dateFormat = 'YYYY-MM-DD';
          });
        }}
      >
        Edit
      </div>
    </>
  );
};
