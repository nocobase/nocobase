import { useDndContext, useDndMonitor, useDraggable, useDroppable } from '@dnd-kit/core';
import { css } from '@emotion/css';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import cls from 'classnames';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useDesignable, useFormBlockContext, useSchemaInitializer } from '../../../';
import { DndContext } from '../../common/dnd-context';

const GridRowContext = createContext<any>({});
const GridColContext = createContext<any>({});
const GridContext = createContext<any>({});

const breakRemoveOnGrid = (s: Schema) => s['x-component'] === 'Grid';
const breakRemoveOnRow = (s: Schema) => s['x-component'] === 'Grid.Row';

const ColDivider = (props) => {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: props.data,
  });
  const { dn, designable } = useDesignable();
  const dividerRef = useRef<HTMLElement>();

  const droppableStyle = {
    backgroundColor: isOver ? 'rgba(241, 139, 98, .1)' : undefined,
  };

  const dndContext = useDndContext();
  const activeSchema: Schema | undefined = dndContext.active?.data.current?.schema?.parent;
  const blocksLength: number = activeSchema ? Object.keys(activeSchema.properties).length : 0;

  let visible = true;
  if (blocksLength === 1) {
    if (props.first) {
      visible = activeSchema !== props.cols[0];
    } else {
      const currentSchema = props.cols[props.index];
      const downSchema = props.cols[props.index + 1];
      visible = activeSchema !== currentSchema && downSchema !== activeSchema;
    }
  }
  const prevSchema = props.cols[props.index];
  const nextSchema = props.cols[props.index + 1];
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    isDragging,
  } = useDraggable({
    disabled: props.first || props.last || !designable,
    id: props.id,
    data: {
      dividerRef,
      prevSchema,
      nextSchema,
    },
  });

  const [clientWidths, setClientWidths] = useState([0, 0]);

  useDndMonitor({
    onDragStart(event) {
      if (!isDragging) {
        return;
      }
      const el = dividerRef.current;
      const prev = el.previousElementSibling as HTMLDivElement;
      const next = el.nextElementSibling as HTMLDivElement;
      setClientWidths([prev.clientWidth, next.clientWidth]);
    },
    onDragMove(event) {
      if (!isDragging) {
        return;
      }
      const el = dividerRef.current;
      const prev = el.previousElementSibling as HTMLDivElement;
      const next = el.nextElementSibling as HTMLDivElement;
      prev.style.width = `calc(${clientWidths[0]}px + ${event.delta.x}px)`;
      next.style.width = `calc(${clientWidths[1]}px - ${event.delta.x}px)`;
    },
    onDragEnd(event) {
      if (clientWidths[0] <= 0 || clientWidths[1] <= 0) {
        return;
      }
      setClientWidths([0, 0]);
      if (!prevSchema || !nextSchema) {
        return;
      }
      const el = dividerRef.current;
      const prev = el.previousElementSibling as HTMLDivElement;
      const next = el.nextElementSibling as HTMLDivElement;
      prevSchema['x-component-props'] = prevSchema['x-component-props'] || {};
      nextSchema['x-component-props'] = nextSchema['x-component-props'] || {};
      prevSchema['x-component-props']['width'] =
        (100 * (prev?.clientWidth + 24 + 24 / props.cols.length)) / el.parentElement.clientWidth;
      nextSchema['x-component-props']['width'] =
        (100 * (next?.clientWidth + 24 + 24 / props.cols.length)) / el.parentElement.clientWidth;
      dn.emit('batchPatch', {
        schemas: [
          {
            ['x-uid']: prevSchema['x-uid'],
            'x-component-props': {
              ...prevSchema['x-component-props'],
            },
          },
          {
            ['x-uid']: nextSchema['x-uid'],
            'x-component-props': {
              ...nextSchema['x-component-props'],
            },
          },
        ],
      });
    },
  });

  return (
    <div
      ref={(el) => {
        if (visible) {
          setNodeRef(el);
          dividerRef.current = el;
        }
      }}
      className={cls(
        'nb-col-divider',
        css`
          width: 24px;
        `,
      )}
      style={{ ...droppableStyle }}
    >
      <div
        ref={setDraggableNodeRef}
        {...listeners}
        {...attributes}
        className={
          props.first || props.last || !designable
            ? null
            : css`
                &::before {
                  content: ' ';
                  width: 12px;
                  height: 100%;
                  left: 6px;
                  position: absolute;
                  cursor: col-resize;
                }
                &:hover {
                  &::before {
                    background: rgba(241, 139, 98, 0.06) !important;
                  }
                }
                width: 24px;
                height: 100%;
                position: absolute;
                cursor: col-resize;
              `
        }
      ></div>
    </div>
  );
};

const RowDivider = (props) => {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: props.data,
  });

  const droppableStyle = {};

  if (isOver) {
    droppableStyle['backgroundColor'] = 'rgba(241, 139, 98, .1)';
  }

  const [active, setActive] = useState(false);

  const dndContext = useDndContext();
  const currentSchema = props.rows[props.index];
  const activeSchema = dndContext.active?.data.current?.schema?.parent.parent;

  const colsLength: number = activeSchema
    ?.mapProperties((schema) => {
      return schema['x-component'] === 'Grid.Col';
    })
    .filter(Boolean).length;

  let visible = true;

  // col > 1 时不需要隐藏
  if (colsLength === 1) {
    if (props.first) {
      visible = activeSchema !== props.rows[0];
    } else {
      const downSchema = props.rows[props.index + 1];
      visible = activeSchema !== currentSchema && downSchema !== activeSchema;
    }
  }

  useDndMonitor({
    onDragStart(event) {
      setActive(true);
    },
    onDragMove(event) {},
    onDragOver(event) {},
    onDragEnd(event) {
      setActive(false);
    },
    onDragCancel(event) {
      setActive(false);
    },
  });

  return (
    <span
      ref={visible ? setNodeRef : null}
      className={cls(
        'nb-row-divider',
        css`
          height: 24px;
          width: 100%;
          position: absolute;
          margin-top: -24px;
        `,
      )}
      style={{
        zIndex: active ? 1000 : -1,
        // height: 24,
        // width: '100%',
        // position: 'absolute',
        // marginTop: -24,
        ...droppableStyle,
      }}
    />
  );
};

const wrapRowSchema = (schema: Schema) => {
  const row = new Schema({
    type: 'void',
    name: `row_${uid()}`,
    'x-uid': uid(),
    'x-component': 'Grid.Row',
  });
  const col = row.addProperty(uid(), {
    type: 'void',
    'x-uid': uid(),
    'x-component': 'Grid.Col',
  });
  if (Schema.isSchemaInstance(schema)) {
    schema.parent = col;
  }
  col.addProperty(schema.name, schema);
  return row;
};

const wrapColSchema = (schema: Schema) => {
  const s = new Schema({
    type: 'void',
    name: `col_${uid()}`,
    'x-uid': uid(),
    'x-component': 'Grid.Col',
  });
  // parent 更新了，需要重新指定
  if (Schema.isSchemaInstance(schema)) {
    schema.parent = s;
  }
  s.addProperty(schema.name, schema);
  return s;
};

const useRowProperties = () => {
  const fieldSchema = useFieldSchema();
  return fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'Grid.Row' && !s['x-hidden']) {
      buf.push(s);
    }
    return buf;
  }, []);
};

const useColProperties = () => {
  const fieldSchema = useFieldSchema();
  return fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'Grid.Col' && !s['x-hidden']) {
      buf.push(s);
    }
    return buf;
  }, []);
};

const DndWrapper = (props) => {
  if (props.dndContext === false) {
    return <>{props.children}</>;
  }
  return <DndContext {...props.dndContext}>{props.children}</DndContext>;
};

export const useGridContext = () => {
  return useContext(GridContext);
};

export const useGridRowContext = () => {
  return useContext(GridRowContext);
};

export const Grid: any = observer((props: any) => {
  const gridRef = useRef(null);
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaInitializer(fieldSchema['x-initializer']);
  const addr = field.address.toString();
  const rows = useRowProperties();
  const { setPrintContent } = useFormBlockContext();

  useEffect(() => {
    gridRef.current && setPrintContent?.(gridRef.current);
  }, [gridRef.current]);
  return (
    <GridContext.Provider value={{ ref: gridRef, fieldSchema, renderSchemaInitializer: render }}>
      <div className={'nb-grid'} style={{ position: 'relative' }} ref={gridRef}>
        <DndWrapper dndContext={props.dndContext}>
          <RowDivider
            rows={rows}
            first
            id={`${addr}_0`}
            data={{
              breakRemoveOn: breakRemoveOnGrid,
              wrapSchema: wrapRowSchema,
              insertAdjacent: 'afterBegin',
              schema: fieldSchema,
            }}
          />
          {rows.map((schema, index) => {
            return (
              <React.Fragment key={schema.name}>
                <RecursionField name={schema.name} schema={schema} />
                <RowDivider
                  rows={rows}
                  index={index}
                  id={`${addr}_${index + 1}`}
                  data={{
                    breakRemoveOn: breakRemoveOnGrid,
                    wrapSchema: wrapRowSchema,
                    insertAdjacent: 'afterEnd',
                    schema,
                  }}
                />
              </React.Fragment>
            );
          })}
        </DndWrapper>
        {render()}
      </div>
    </GridContext.Provider>
  );
});

Grid.Row = observer((props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const addr = field.address.toString();
  const cols = useColProperties();

  return (
    <GridRowContext.Provider value={{ schema: fieldSchema, cols }}>
      <div
        className={cls(
          'nb-grid-row',
          css`
            margin: 0 -24px;
            display: flex;
            position: relative;
            /* z-index: 0; */
          `,
        )}
      >
        <ColDivider
          cols={cols}
          first
          id={`${addr}_0`}
          data={{
            breakRemoveOn: breakRemoveOnRow,
            wrapSchema: wrapColSchema,
            insertAdjacent: 'afterBegin',
            schema: fieldSchema,
          }}
        />
        {cols.map((schema, index) => {
          return (
            <React.Fragment key={schema.name}>
              <RecursionField name={schema.name} schema={schema} />
              <ColDivider
                cols={cols}
                index={index}
                last={index === cols.length - 1}
                id={`${addr}_${index + 1}`}
                data={{
                  breakRemoveOn: breakRemoveOnRow,
                  wrapSchema: wrapColSchema,
                  insertAdjacent: 'afterEnd',
                  schema,
                }}
              />
            </React.Fragment>
          );
        })}
      </div>
    </GridRowContext.Provider>
  );
});

Grid.Col = observer((props: any) => {
  const { cols } = useContext(GridRowContext);
  const schema = useFieldSchema();
  const field = useField();
  const w = schema?.['x-component-props']?.['width'] || 100 / cols.length;
  const width = `calc(${w}% - 24px - 24px / ${cols.length})`;
  const { isOver, setNodeRef } = useDroppable({
    id: field.address.toString(),
    data: {
      insertAdjacent: 'beforeEnd',
      schema,
      wrapSchema: (s) => s,
    },
  });
  return (
    <GridColContext.Provider value={{ cols, schema }}>
      <div
        ref={setNodeRef}
        style={{ width }}
        className={cls(
          'nb-grid-col',
          css`
            position: relative;
            /* z-index: 0; */
          `,
        )}
      >
        {props.children}
      </div>
    </GridColContext.Provider>
  );
});
