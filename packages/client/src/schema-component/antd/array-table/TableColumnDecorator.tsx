import { useField, useFieldSchema } from '@formily/react';
import React, { useLayoutEffect } from 'react';
import { designerCss, SortableItem, useCollection, useDesignable, useDesigner } from '../../../';

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
    return {};
  }
  const collectionField = getField(fieldSchema.name);
  return { columnSchema, fieldSchema, collectionField };
};

export const TableColumnDecorator = (props) => {
  const Designer = useDesigner();
  const field = useField();
  const { fieldSchema, collectionField } = useColumnSchema();
  const { refresh } = useDesignable();
  useLayoutEffect(() => {
    if (field.title) {
      return;
    }
    if (!fieldSchema) {
      return;
    }
    if (collectionField?.uiSchema?.title) {
      field.title = collectionField?.uiSchema?.title;
    }
  }, [collectionField?.uiSchema?.title]);
  console.log('field.title', collectionField?.uiSchema?.title, field.title);
  return (
    <SortableItem className={designerCss}>
      <Designer />
      {/* <RecursionField name={columnSchema.name} schema={columnSchema}/> */}
      {field.title || collectionField?.uiSchema?.title}
      {/* <div
        onClick={() => {
          field.title = uid();
          // columnSchema.title = field.title = field.title;
          // refresh();
          // field.query(`.*.${fieldSchema.name}`).take((f) => {
          //   f.componentProps.dateFormat = 'YYYY-MM-DD';
          // });
        }}
      >
        Edit
      </div> */}
    </SortableItem>
  );
};
