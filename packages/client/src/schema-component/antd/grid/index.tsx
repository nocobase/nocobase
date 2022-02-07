import { useDroppable } from '@dnd-kit/core';
import { css } from '@emotion/css';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import cls from 'classnames';
import React from 'react';
import { DndContext } from '../../common/dnd-context';

export const Grid: any = observer((props) => {
  return (
    <div>
      <DndContext>{props.children}</DndContext>
    </div>
  );
});

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
  return <div className={cls('nb-grid-col')}>{props.children}</div>;
});
