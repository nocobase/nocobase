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

import { useDesignable, useSchemaPath } from '../DesignableSchemaField';
import { DragDropManagerProvider, useColResizer } from './hooks';
import { useDrag, useDrop, mergeRefs } from './hooks';

export const GridContext = createContext({
  ref: null,
  gridName: null,
});

const ColumnSizeContext = createContext(null);

export const GridBlockContext = createContext({
  dragRef: null,
});

const RowDivider = ({ name, onDrop }) => {
  const { gridName } = useContext(GridContext);
  const { isOver, dropRef } = useDrop({
    uid: `row_divider_${name}`,
    accept: gridName,
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
  const { gridName } = useContext(GridContext);
  const { isDragging, dragRef } = useColResizer({ onDragEnd });
  const { isOver, dropRef } = useDrop({
    uid: `col_divider_${name}`,
    accept: gridName,
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
    <DragDropManagerProvider>
      <GridContext.Provider value={{ ref, gridName: schema.name }}>
        <div ref={ref} className={'nb-grid'}>
          <RowDivider
            key={`${schema.name}_0`}
            name={`${schema.name}_0`}
            onDrop={(e) => {
              const blockSchema = e.dragItem.schema;
              const path = [...e.dragItem.path];
              prepend({
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
                  onDrop={(e) => {
                    const blockSchema = e.dragItem.schema;
                    const path = [...e.dragItem.path];
                    insertAfter(
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
                    deepRemove(path);
                  }}
                />
              </>
            );
          })}
        </div>
      </GridContext.Provider>
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
        onDrop={(e) => {
          const blockSchema = e.dragItem.schema;
          prepend({
            type: 'void',
            'x-component': 'Grid.Col',
            properties: {
              [blockSchema.name]: blockSchema,
            },
          });
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
              onDrop={(e) => {
                const blockSchema = e.dragItem.schema;
                insertAfter(
                  {
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      [blockSchema.name]: blockSchema,
                    },
                  },
                  [...rowPath, key],
                );
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

Grid.Block = observer((props) => {
  const schema = useFieldSchema();
  const ctx = useContext(GridContext);
  const path = useSchemaPath();
  const { isDragging, dragRef, previewRef } = useDrag({
    type: ctx.gridName,
    onDragStart() {
      console.log('onDragStart');
    },
    onDragEnd(event) {
      console.log('onDragEnd', event.data);
    },
    onDrag(event) {
      // console.log('onDrag');
    },
    item: {
      path,
      schema: schema.toJSON(),
    },
  });
  const { isOver, onTopHalf, dropRef } = useDrop({
    uid: schema.name,
    accept: ctx.gridName,
    data: {},
    canDrop: !isDragging,
  });
  useEffect(() => {
    if (ctx.ref && ctx.ref.current) {
      (ctx.ref.current as HTMLElement).className = isDragging
        ? 'nb-grid dragging'
        : 'nb-grid';
    }
    console.log('ctx.ref.current');
  }, [isDragging]);
  return (
    <GridBlockContext.Provider value={{ dragRef }}>
      <div
        ref={mergeRefs([previewRef, dropRef])}
        className={cls('nb-grid-block', {
          'top-half': onTopHalf,
          hover: isOver,
          dragging: isDragging,
        })}
      >
        {props.children}
      </div>
    </GridBlockContext.Provider>
  );
});
