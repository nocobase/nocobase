import React, {
  FC,
  CSSProperties,
  useRef,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
// import { DndProvider, useDrag, useDragDropManager } from 'react-dnd';
// import { HTML5Backend } from 'react-dnd-html5-backend';
import { uid } from '@formily/shared';
import {
  observer,
  ISchema,
  FormProvider,
  useFieldSchema,
  RecursionField,
  useField,
} from '@formily/react';
import './style.less';
import cls from 'classnames';

import { createSchema, useDesignable, useSchemaPath } from '../';
import {
  useDrag,
  useDrop,
  mergeRefs,
  useColResizer,
  useDragDropUID,
  DragDropManagerProvider,
} from '../../components/drag-and-drop';

const ColumnSizeContext = createContext(null);

export const GridBlockContext = createContext({
  dragRef: null,
});

const RowDivider = ({ name, onDrop }) => {
  const uid = useDragDropUID();
  const { isOver, dropRef } = useDrop({
    uid: `row_divider_${name}`,
    accept: uid,
    shallow: true,
    onDrop,
  });
  return (
    <div
      ref={dropRef}
      className={cls('nb-grid-row-divider', { hover: isOver })}
    />
  );
};

const ColDivider = (props: any) => {
  const { name, onDragEnd, resizable, onDrop } = props;
  const uid = useDragDropUID();
  const { isDragging, dragRef } = useColResizer({ onDragEnd });
  const { isOver, dropRef } = useDrop({
    uid: `col_divider_${name}`,
    accept: uid,
    shallow: true,
    onDrop,
  });
  return (
    <div
      data-type={'col-divider'}
      ref={mergeRefs([dragRef, dropRef])}
      style={{ width: 24 }}
      className={cls('nb-grid-col-divider', {
        resizable,
        hover: isOver,
        dragging: isDragging,
      })}
    ></div>
  );
};

export const Grid: any = observer((props) => {
  const ref = useRef();
  const schema = useFieldSchema();
  const gridPath = useSchemaPath();
  const {
    schema: designableSchema,
    insertAfter,
    prepend,
    deepRemove,
  } = useDesignable();
  return (
    <DragDropManagerProvider uid={schema.name}>
      <div ref={ref} className={'nb-grid'}>
        <RowDivider
          key={`${schema.name}_0`}
          name={`${schema.name}_0`}
          onDrop={async (e) => {
            const blockSchema = e.dragItem.schema;
            const path = [...e.dragItem.path];
            const data = prepend({
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    [blockSchema.name]: blockSchema,
                  },
                },
              },
            });
            await createSchema(data);
            console.log('prepend', data);
            deepRemove(path);
          }}
        />
        {schema.mapProperties((property, key, index) => {
          return (
            <>
              <div style={{ display: 'flex' }} className={'nb-grid-row'}>
                <RecursionField name={property.name} schema={property} />
              </div>
              <RowDivider
                key={`${schema.name}_${index + 1}`}
                name={`${schema.name}_${index + 1}`}
                onDrop={async (e) => {
                  const blockSchema = e.dragItem.schema;
                  const path = [...e.dragItem.path];
                  const data = insertAfter(
                    {
                      type: 'void',
                      'x-component': 'Grid.Row',
                      properties: {
                        [uid()]: {
                          type: 'void',
                          'x-component': 'Grid.Col',
                          properties: {
                            [blockSchema.name]: blockSchema,
                          },
                        },
                      },
                    },
                    [...gridPath, key],
                  );
                  await createSchema(data);
                  console.log('insertAfter', data);
                  deepRemove(path);
                }}
              />
            </>
          );
        })}
      </div>
    </DragDropManagerProvider>
  );
});

Grid.Row = observer((props) => {
  const field = useField();
  const schema = useFieldSchema();
  const rowPath = useSchemaPath();
  const {
    schema: designableSchema,
    refresh,
    insertAfter,
    appendChild,
    prepend,
    remove,
    deepRemove,
  } = useDesignable();
  const len = Object.keys(designableSchema.properties || {}).length;
  console.log({ len, schema, designableSchema });
  return (
    <ColumnSizeContext.Provider value={len}>
      <ColDivider
        name={`${schema.name}_0`}
        onDrop={async (e) => {
          const blockSchema = e.dragItem.schema;
          const data = prepend({
            type: 'void',
            'x-component': 'Grid.Col',
            properties: {
              [blockSchema.name]: blockSchema,
            },
          });
          await createSchema(data);
          const path = [...e.dragItem.path];
          deepRemove(path);
        }}
      />
      {schema.mapProperties((property, key, index) => {
        return (
          <>
            <RecursionField name={property.name} schema={property} />
            <ColDivider
              name={`${schema.name}_${index + 1}`}
              resizable={index < len - 1}
              onDrop={async (e) => {
                const blockSchema = e.dragItem.schema;
                const data = insertAfter(
                  {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      [blockSchema.name]: blockSchema,
                    },
                  },
                  [...rowPath, key],
                );
                console.log('ColDivider', data)
                await createSchema(data);
                const path = [...e.dragItem.path];
                deepRemove(path);
              }}
              onDragEnd={(e) => {
                designableSchema.mapProperties((s, key, index) => {
                  s['x-component-props'] = s['x-component-props'] || {};
                  s['x-component-props']['width'] = e.data.size[index];
                  return s;
                });
                schema.mapProperties((s, key, index) => {
                  s['x-component-props'] = s['x-component-props'] || {};
                  s['x-component-props']['width'] = e.data.size[index];
                  field.query(`.${schema.name}.${key}`).take((f) => {
                    f.componentProps['width'] = e.data.size[index];
                  });
                  return s;
                });
                // refresh();
              }}
            />
          </>
        );
      })}
    </ColumnSizeContext.Provider>
  );
});

Grid.Col = observer((props) => {
  const field = useField();
  const width = field.componentProps['width'];
  const size = useContext(ColumnSizeContext);
  return (
    <div
      style={{ width: `calc(${width || 100 / size}% - 24px - 24px / ${size})` }}
      className={'nb-grid-col'}
    >
      {props.children}
    </div>
  );
});
