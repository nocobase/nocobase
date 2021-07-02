import React, {
  FC,
  CSSProperties,
  useRef,
  createContext,
  useContext,
  useEffect,
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
import { useColResizer } from './hooks';
import { useDrag, useDrop, DragDropProvider, mergeRefs } from './hooks';

export const GridContext = createContext({
  ref: null,
});

const ColumnSizeContext = createContext(null);

export const GridBlockContext = createContext({
  dragRef: null,
});

const RowDivider = ({ onDrop }) => {
  const { isOver, dropRef } = useDrop({
    accept: 'grid',
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
  const { onDragEnd, resizable } = props;
  const { isDragging, dragRef } = useColResizer({ onDragEnd });
  const { isOver, dropRef } = useDrop({
    accept: 'grid',
    data: {},
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
  const schema = useFieldSchema();
  const { insertBefore, insertAfter, remove } = useDesignable();
  const ref = useRef();
  return (
    <DragDropProvider>
      <GridContext.Provider value={{ ref }}>
        <div ref={ref} className={'nb-grid'}>
          <RowDivider
            onDrop={(e) => {
              const blockSchema = e.dragItem.schema;
              const path = [...e.dragItem.path];
                    path.pop();
                    remove(path);
              insertBefore({
                type: 'void',
                "x-component": 'Grid.Row',
                properties: {
                  [uid()]: {
                    type: 'void',
                    "x-component": 'Grid.Col',
                    properties: {
                      [blockSchema.name]: blockSchema,
                    },
                  },
                },
              });
            }}
          />
          {schema.mapProperties((property) => {
            return (
              <>
                <div style={{ display: 'flex' }} className={'nb-grid-row'}>
                  <RecursionField name={property.name} schema={property} />
                </div>
                <RowDivider
                  onDrop={(e) => {
                    const blockSchema = e.dragItem.schema;
                    const path = [...e.dragItem.path];
                    path.pop();
                    remove(path);
                    insertAfter({
                      type: 'void',
                      "x-component": 'Grid.Row',
                      properties: {
                        [uid()]: {
                          type: 'void',
                          "x-component": 'Grid.Col',
                          properties: {
                            [blockSchema.name]: blockSchema,
                          },
                        },
                      },
                    });
                  }}
                />
              </>
            );
          })}
        </div>
      </GridContext.Provider>
    </DragDropProvider>
  );
});

Grid.Row = observer((props) => {
  const field = useField();
  const schema = useFieldSchema();
  const { schema: designableSchema, refresh } = useDesignable();
  const len = Object.keys(schema.properties || {}).length;
  return (
    <ColumnSizeContext.Provider value={len}>
      {schema.mapProperties((property, key, index) => {
        return (
          <>
            <ColDivider
              resizable={index > 0}
              onDragEnd={(e) => {
                schema.mapProperties((s, key, index) => {
                  field.query(`.${schema.name}.${key}`).take((f) => {
                    f.componentProps['width'] = e.data.size[index];
                  });
                  s['x-component-props'] = s['x-component-props'] || {};
                  s['x-component-props']['width'] = e.data.size[index];
                  return s;
                });
                designableSchema.mapProperties((s, key, index) => {
                  s['x-component-props'] = s['x-component-props'] || {};
                  s['x-component-props']['width'] = e.data.size[index];
                  return s;
                });

                refresh();
                console.log('e.data', designableSchema);
              }}
            />
            <RecursionField name={property.name} schema={property} />
          </>
        );
      })}
      <ColDivider />
    </ColumnSizeContext.Provider>
  );
});

Grid.Col = observer((props) => {
  const field = useField();
  const width = field.componentProps['width'];
  const size = useContext(ColumnSizeContext);
  return (
    <div
      style={{ width: `calc(${width || 100 / size}% - 24px / ${size})` }}
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
    type: 'grid',
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
    accept: 'grid',
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
