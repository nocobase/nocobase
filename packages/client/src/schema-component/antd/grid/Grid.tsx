import { useDndMonitor, useDroppable } from '@dnd-kit/core';
import { css } from '@emotion/css';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import cls from 'classnames';
import React, { createContext, useContext, useState } from 'react';
import { useComponent } from '../..';
import { DndContext } from '../../common/dnd-context';
import { AddGridBlockItem } from './AddBlockItem';
import { AddGridFormItem } from './AddFormItem';

const GridRowContext = createContext(null);
const GridColContext = createContext(null);

const ColDivider = (props) => {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: props.data,
  });

  const droppableStyle = {
    backgroundColor: isOver ? 'green' : undefined,
  };

  return <div ref={setNodeRef} style={{ width: 24, ...droppableStyle }}></div>;
};

const RowDivider = (props) => {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: props.data,
  });

  const droppableStyle = {};

  if (isOver) {
    droppableStyle['backgroundColor'] = 'green';
  }

  const [active, setActive] = useState(false);

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
    <div
      ref={setNodeRef}
      style={{
        zIndex: active ? 1000 : 0,
        height: 24,
        width: '100%',
        position: 'absolute',
        marginTop: -24,
        ...droppableStyle,
      }}
    ></div>
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

export const Grid: any = observer((props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const ItemInitializer = useComponent(fieldSchema['x-item-initializer']);
  const addr = field.address.toString();
  const rows = useRowProperties();
  return (
    <div className={'nb-grid'} style={{ position: 'relative' }}>
      <DndContext>
        <RowDivider
          id={`${addr}_0`}
          data={{ wrapSchema: wrapRowSchema, insertAdjacent: 'afterBegin', schema: fieldSchema }}
        />
        {rows.map((schema, index) => {
          return (
            <React.Fragment key={schema.name}>
              <RecursionField name={schema.name} schema={schema} />
              <RowDivider
                id={`${addr}_${index + 1}`}
                data={{ wrapSchema: wrapRowSchema, insertAdjacent: 'afterEnd', schema }}
              />
            </React.Fragment>
          );
        })}
      </DndContext>
      <div>{ItemInitializer && <ItemInitializer />}</div>
    </div>
  );
});

Grid.Row = observer((props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const addr = field.address.toString();
  const cols = useColProperties();
  return (
    <GridRowContext.Provider value={{ cols }}>
      <div
        className={cls(
          'nb-grid-row',
          css`
            margin: 0 -24px;
            display: flex;
            position: relative;
            z-index: 0;
          `,
        )}
      >
        <ColDivider
          id={`${addr}_0`}
          data={{ wrapSchema: wrapColSchema, insertAdjacent: 'afterBegin', schema: fieldSchema }}
        />
        {cols.map((schema, index) => {
          return (
            <React.Fragment key={schema.name}>
              <RecursionField name={schema.name} schema={schema} />
              <ColDivider
                id={`${addr}_${index + 1}`}
                data={{ wrapSchema: wrapColSchema, insertAdjacent: 'afterEnd', schema }}
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
  const w = props.width || 100 / cols.length;
  const width = `calc(${w}% - 24px - 24px / ${cols.length})`;
  return (
    <div
      style={{ width }}
      className={cls(
        'nb-grid-col',
        css`
          position: relative;
          z-index: 0;
        `,
      )}
    >
      {props.children}
    </div>
  );
});

Grid.AddFormItem = AddGridFormItem;
Grid.AddBlockItem = AddGridBlockItem;
