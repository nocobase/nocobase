import { useDndMonitor, useDroppable } from '@dnd-kit/core';
import { css } from '@emotion/css';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import cls from 'classnames';
import React, { useState } from 'react';
import { DndContext } from '../../common/dnd-context';

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

export const Grid: any = observer((props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const addr = field.address.toString();
  const wrapSchema = (schema: Schema) => {
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
  return (
    <div className={'nb-grid'} style={{ position: 'relative' }}>
      <DndContext>
        <RowDivider id={`${addr}_0`} data={{ wrapSchema, insertAdjacent: 'afterBegin', schema: fieldSchema }} />
        {fieldSchema.mapProperties((schema, key, index) => {
          return (
            <React.Fragment key={key}>
              <RecursionField name={key} schema={schema} />
              <RowDivider id={`${addr}_${index + 1}`} data={{ wrapSchema, insertAdjacent: 'afterEnd', schema }} />
            </React.Fragment>
          );
        })}
      </DndContext>
    </div>
  );
});

Grid.Row = observer((props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const addr = field.address.toString();
  const wrapSchema = (schema: Schema) => {
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
  const onInsertAdjacent = ({ dn, draggedSchema }) => {
    dn.remove(draggedSchema, {
      removeEmptyParents: true,
    });
  };
  console.log('fieldSchema', fieldSchema.toJSON());
  return (
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
        data={{ wrapSchema, insertAdjacent: 'afterBegin', schema: fieldSchema, onInsertAdjacent }}
      />
      {fieldSchema.mapProperties((schema, key, index) => {
        return (
          <React.Fragment key={key}>
            <RecursionField name={key} schema={schema} />
            <ColDivider
              id={`${addr}_${index + 1}`}
              data={{ wrapSchema, insertAdjacent: 'afterEnd', schema, onInsertAdjacent }}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
});

Grid.Col = observer((props) => {
  return (
    <div
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
