import { useDraggable, useDroppable } from '@dnd-kit/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext } from 'react';

export const DraggableContext = createContext(null);

export const Sortable = (props: any) => {
  const draggable = useDraggable({
    id: props.id,
    data: props.data,
  });

  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: props.data,
  });

  const droppableStyle = {
    color: isOver ? 'green' : undefined,
  };

  return (
    <DraggableContext.Provider value={draggable}>
      <div ref={setNodeRef} style={droppableStyle}>
        {props.children}
      </div>
    </DraggableContext.Provider>
  );
};

export const SortableItem = observer((props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const onInsertAdjacent = ({ dn, orginDraggedParentSchema }) => {
    dn.removeIfChildrenEmpty(orginDraggedParentSchema, {
      removeEmptyParents: true,
    });
  };
  return (
    <Sortable
      id={field.address.toString()}
      data={{ insertAdjacent: 'afterEnd', onInsertAdjacent, schema: fieldSchema }}
    >
      {props.children}
    </Sortable>
  );
});

export const DragHandler = () => {
  const { attributes, listeners, setNodeRef, transform } = useContext(DraggableContext);
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;
  return (
    <div ref={setNodeRef} style={{ ...style, display: 'inline-block' }} {...listeners} {...attributes}>
      Drag
    </div>
  );
};
