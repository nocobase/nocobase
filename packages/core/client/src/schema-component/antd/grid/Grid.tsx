/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TinyColor } from '@ctrl/tinycolor';
import { useDndContext, useDndMonitor, useDraggable, useDroppable } from '@dnd-kit/core';
import { ISchema, Schema, observer, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import cls from 'classnames';
import _ from 'lodash';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SchemaComponent, useDesignable, useSchemaInitializerRender } from '../../../';
import { useFormBlockContext } from '../../../block-provider/FormBlockProvider';
import { FilterBlockProvider } from '../../../filter-provider/FilterProvider';
import {
  NocoBaseRecursionField,
  RefreshComponentProvider,
  useRefreshComponent,
  useRefreshFieldSchema,
} from '../../../formily/NocoBaseRecursionField';
import { DndContext, DndContextProps } from '../../common/dnd-context';
import { useToken } from '../__builtins__';
import useStyles from './Grid.style';

export const GridRowContext = createContext<any>({});
GridRowContext.displayName = 'GridRowContext';
const GridColContext = createContext<any>({});
GridColContext.displayName = 'GridColContext';
const GridContext = createContext<any>({});
GridContext.displayName = 'GridContext';

const breakRemoveOnGrid = (s: Schema) => s['x-component'] === 'Grid';
const breakRemoveOnRow = (s: Schema) => s['x-component'] === 'Grid.Row';

const ColDivider = (props) => {
  const { token } = useToken();
  const dragIdRef = useRef<any>(null);
  const { dn, designable } = useDesignable();
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: props.data,
    disabled: !designable,
  });
  const dividerRef = useRef<HTMLElement>();

  const droppableStyle = useMemo(() => {
    if (!isOver) return {};
    return {
      backgroundColor: new TinyColor(token.colorSettings).setAlpha(0.1).toHex8String(),
    };
  }, [isOver]);

  const dndContext = useDndContext();
  const activeSchema: Schema | undefined = dndContext.active?.data.current?.schema?.parent;
  const blocksLength: number = useMemo(
    () => (activeSchema ? Object.keys(activeSchema.properties).length : 0),
    [activeSchema],
  );

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
  const draggableDisabled = props.first || props.last || !designable;
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    isDragging,
  } = useDraggable({
    disabled: draggableDisabled,
    id: props.id,
    data: {
      dividerRef,
      prevSchema,
      nextSchema,
    },
    attributes: {
      tabIndex: draggableDisabled ? -1 : 0,
    },
  });

  const [clientWidths, setClientWidths] = useState([0, 0]);

  useDndMonitor({
    onDragStart(event) {
      const dividerRef = event.active?.data?.current?.dividerRef;
      if (!dividerRef) {
        return;
      }
      if (!designable) {
        return;
      }
      dragIdRef.current = event.active.id;
      const el = dividerRef.current;
      const prev = el.previousElementSibling as HTMLDivElement;
      const next = el.nextElementSibling as HTMLDivElement;
      setClientWidths([prev.clientWidth, next.clientWidth]);
    },
    onDragMove(event) {
      if (!designable || !isDragging) {
        return;
      }
      if (dragIdRef.current === event.active.id) {
        dragIdRef.current = dragIdRef.current + '_move';
      }
      const el = dividerRef.current;
      const prev = el.previousElementSibling as HTMLDivElement;
      const next = el.nextElementSibling as HTMLDivElement;
      prev.style.width = `${clientWidths[0] + event.delta.x}px`;
      next.style.width = `${clientWidths[1] - event.delta.x}px`;
    },
    onDragEnd(event) {
      if (!designable || !dragIdRef.current) return;
      if (dragIdRef.current?.startsWith(event.active.id)) {
        if (!dragIdRef.current.endsWith('_move')) {
          return;
        }
      }
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
      const dividerWidth = (el.clientWidth * (props.cols.length + 1)) / props.cols.length;
      const preWidth = (
        (100 * (prev.getBoundingClientRect().width + dividerWidth)) /
        el.parentElement.clientWidth
      ).toFixed(2);
      const nextWidth = (
        (100 * (next.getBoundingClientRect().width + dividerWidth)) /
        el.parentElement.clientWidth
      ).toFixed(2);

      _.set(prevSchema, 'x-component-props.width', preWidth);
      _.set(nextSchema, 'x-component-props.width', nextWidth);
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
      className={cls('nb-col-divider', 'ColDivider')}
      style={droppableStyle}
    >
      <div
        ref={setDraggableNodeRef}
        {...listeners}
        {...attributes}
        className={props.first || props.last || !designable ? null : 'DraggableNode'}
      ></div>
    </div>
  );
};

const RowDivider = React.memo(
  (props: { rows?: Schema[]; index?: number; id?: string; data?: any; first?: boolean }) => {
    const { token } = useToken();
    const { designable } = useDesignable();
    const { isOver, setNodeRef } = useDroppable({
      id: props.id,
      data: props.data,
      disabled: !designable,
    });
    const [active, setActive] = useState(false);
    const droppableStyle = useMemo(() => {
      if (!isOver)
        return {
          zIndex: active ? 1000 : -1,
        };

      return {
        zIndex: active ? 1000 : -1,
        backgroundColor: new TinyColor(token.colorSettings).setAlpha(0.1).toHex8String(),
      };
    }, [active, isOver]);

    const dndContext = useDndContext();
    const currentSchema = props.rows[props.index];
    const activeSchema = dndContext.active?.data.current?.schema?.parent.parent;

    const colsLength: number = useMemo(
      () =>
        activeSchema
          ?.mapProperties((schema) => {
            return schema['x-component'] === 'Grid.Col';
          })
          .filter(Boolean).length,
      [activeSchema],
    );

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
        if (!designable) return;
        setActive(true);
      },
      onDragMove(event) {},
      onDragOver(event) {},
      onDragEnd(event) {
        if (!designable) return;
        setActive(false);
      },
      onDragCancel(event) {
        if (!designable) return;
        setActive(false);
      },
    });

    return (
      <span ref={visible ? setNodeRef : null} className={cls('nb-row-divider', 'RowDivider')} style={droppableStyle} />
    );
  },
);

RowDivider.displayName = 'RowDivider';

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
  return useMemo(() => {
    return fieldSchema.reduceProperties((buf, s) => {
      if (s['x-component'] === 'Grid.Row' && !s['x-hidden']) {
        buf.push(s);
      }
      return buf;
    }, []);
  }, [fieldSchema]);
};

const useColProperties = () => {
  const fieldSchema = useFieldSchema();
  return useMemo(() => {
    return fieldSchema.reduceProperties((buf, s) => {
      if (s['x-component'] === 'Grid.Col' && !s['x-hidden']) {
        buf.push(s);
      }
      return buf;
    }, []);
  }, [fieldSchema]);
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

export interface GridProps {
  distributed?: boolean;
  showDivider?: boolean;
  dndContext?: false | DndContextProps;
}

const getRowDividerData = _.memoize((schema: Schema, insertAdjacent: string) => {
  return {
    breakRemoveOn: breakRemoveOnGrid,
    wrapSchema: wrapRowSchema,
    insertAdjacent,
    schema,
  };
});

export const Grid: any = observer(
  (props: GridProps) => {
    const { distributed, showDivider = true } = props;
    const gridRef = useRef(null);
    const field = useField();
    const fieldSchema = useFieldSchema();
    const { render } = useSchemaInitializerRender(fieldSchema['x-initializer'], fieldSchema['x-initializer-props']);
    const InitializerComponent = useCallback((props) => render(props), []);
    const addr = field.address.toString();
    const rows = useRowProperties();
    const { setPrintContent } = useFormBlockContext();
    const { componentCls, hashId } = useStyles();
    const distributedValue =
      distributed === undefined
        ? fieldSchema?.parent['x-component'] === 'Page' || fieldSchema?.parent['x-component'] === 'Tabs.TabPane'
        : distributed;

    useEffect(() => {
      gridRef.current && setPrintContent?.(gridRef.current);
    }, [setPrintContent]);

    const gridContextValue = useMemo(() => {
      return {
        ref: gridRef,
        fieldSchema,
        renderSchemaInitializer: render,
        InitializerComponent,
        showDivider,
      };
    }, [fieldSchema, render, InitializerComponent, showDivider]);

    const refreshFieldSchema = useRefreshFieldSchema();
    const refreshComponent = useRefreshComponent();
    const refresh = useCallback(() => {
      refreshFieldSchema?.();
      refreshComponent?.();
    }, [refreshComponent, refreshFieldSchema]);

    return (
      <RefreshComponentProvider refresh={refresh}>
        <FilterBlockProvider>
          <GridContext.Provider value={gridContextValue}>
            <div className={cls('nb-grid-container')}>
              <div className={cls(`nb-grid ${componentCls} ${hashId}`)} ref={gridRef}>
                <div className="nb-grid-warp">
                  <DndWrapper dndContext={props.dndContext}>
                    {showDivider ? (
                      <RowDivider
                        rows={rows}
                        first
                        id={`${addr}_0`}
                        data={getRowDividerData(fieldSchema, 'afterBegin')}
                      />
                    ) : null}
                    {rows.map((schema, index) => {
                      return (
                        <React.Fragment key={index}>
                          {distributedValue ? (
                            <SchemaComponent name={schema.name} schema={schema} distributed />
                          ) : (
                            <NocoBaseRecursionField name={schema.name} schema={schema} isUseFormilyField />
                          )}
                          {showDivider ? (
                            <RowDivider
                              rows={rows}
                              index={index}
                              id={`${addr}_${index + 1}`}
                              data={getRowDividerData(schema, 'afterEnd')}
                            />
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </DndWrapper>
                  {render()}
                </div>
              </div>
            </div>
          </GridContext.Provider>
        </FilterBlockProvider>
      </RefreshComponentProvider>
    );
  },
  { displayName: 'Grid' },
);

Grid.Row = observer(
  () => {
    const field = useField();
    const fieldSchema = useFieldSchema();
    const addr = field.address.toString();
    const cols = useColProperties();
    const { showDivider } = useGridContext();

    const ctxValue = useMemo(() => {
      return {
        schema: fieldSchema,
        cols,
      };
    }, [fieldSchema, cols]);

    return (
      <GridRowContext.Provider value={ctxValue}>
        <div
          className={cls('nb-grid-row', 'CardRow', {
            showDivider,
          })}
        >
          {showDivider && (
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
          )}
          {cols.map((schema, index) => {
            return (
              <React.Fragment key={index}>
                <NocoBaseRecursionField name={schema.name} schema={schema} isUseFormilyField />
                {showDivider && (
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
                )}
              </React.Fragment>
            );
          })}
        </div>
      </GridRowContext.Provider>
    );
  },
  { displayName: 'Grid.Row' },
);

Grid.Col = observer(
  (props: any) => {
    const { cols = [] } = useContext(GridRowContext);
    const { showDivider } = useGridContext();
    const schema = useFieldSchema();
    const field = useField();
    const { token } = useToken();
    const { designable } = useDesignable();

    const style = useMemo(() => {
      let width = '';
      if (cols?.length) {
        const w = schema?.['x-component-props']?.['width'] || 100 / cols.length;
        width = `calc(${w}% - ${token.marginBlock}px *  ${(showDivider ? cols.length + 1 : 0) / cols.length})`;
      }
      return { width };
    }, [cols.length, schema, showDivider, token.marginBlock]);

    const { isOver, setNodeRef } = useDroppable({
      id: field.address.toString(),
      data: {
        insertAdjacent: 'beforeEnd',
        schema,
        wrapSchema: (s) => s,
      },
      disabled: !designable,
    });
    const [active, setActive] = useState(false);

    const droppableStyle = useMemo(() => {
      if (!isOver)
        return {
          height: '100%',
        };

      return {
        background: `linear-gradient(to top,  ${new TinyColor(token.colorSettings)
          .setAlpha(0.1)
          .toHex8String()} 20%, transparent 20%)`,
        borderTopRightRadius: '10px',
        borderTopLeftRadius: '10px',
        height: '100%',
      };
    }, [active, isOver]);

    useDndMonitor({
      onDragStart(event) {
        if (!designable) return;
        setActive(true);
      },
      onDragMove(event) {},
      onDragOver(event) {},
      onDragEnd(event) {
        if (!designable) return;
        setActive(false);
      },
      onDragCancel(event) {
        if (!designable) return;
        setActive(false);
      },
    });

    const value = useMemo(() => ({ cols, schema }), [cols, schema]);
    const colStyle = useMemo(() => ({ ...style, ...droppableStyle }), [droppableStyle, style]);

    return (
      <GridColContext.Provider value={value}>
        <div ref={setNodeRef} style={colStyle} className={cls('nb-grid-col', props.className)}>
          {props.children}
        </div>
      </GridColContext.Provider>
    );
  },
  { displayName: 'Grid.Col' },
);

Grid.wrap = (schema: ISchema) => {
  return {
    type: 'void',
    'x-component': 'Grid.Row',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Grid.Col',
        properties: {
          [schema.name || uid()]: schema,
        },
      },
    },
  };
};
