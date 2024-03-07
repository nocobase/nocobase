import { useField, useFieldSchema } from '@formily/react';
import React, { useLayoutEffect } from 'react';
import {
  SortableItem,
  useCollection_deprecated,
  useCollectionManager_deprecated,
  useCompile,
  useDesigner,
  CollectionFieldContext,
  useFlag,
} from '../../../';
import { designerCss } from './Table.Column.ActionBar';
import { isCollectionFieldComponent } from './utils';

export const useColumnSchema = () => {
  const { getField } = useCollection_deprecated();
  const compile = useCompile();
  const columnSchema = useFieldSchema();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
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

export const TableColumnDecorator = (props) => {
  const Designer = useDesigner();
  const field = useField();
  const { fieldSchema, uiSchema, collectionField } = useColumnSchema();
  const compile = useCompile();
  const { isInSubTable } = useFlag() || {};
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
  }, [uiSchema?.title]);
  return (
    <SortableItem
      className={designerCss({
        margin: isInSubTable ? '-12px -8px' : '-18px -16px',
        padding: isInSubTable ? '12px 8px' : '18px 16px',
      })}
    >
      <CollectionFieldContext.Provider value={collectionField}>
        <Designer fieldSchema={fieldSchema} uiSchema={uiSchema} collectionField={collectionField} />
        {/* <RecursionField name={columnSchema.name} schema={columnSchema}/> */}
        <div role="button">{field?.title || compile(uiSchema?.title)}</div>
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
      </CollectionFieldContext.Provider>
    </SortableItem>
  );
};
