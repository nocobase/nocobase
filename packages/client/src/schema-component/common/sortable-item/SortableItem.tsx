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
  const { isDragging, attributes, listeners, setNodeRef, transform } = useContext(DraggableContext);
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      style={{
        display: 'inline-block',
      }}
    >
      <div style={{ display: isDragging ? 'inline-block' : 'none', fontSize: 10, position: 'absolute', zIndex: 0 }}>
        Drag
      </div>
      <div
        ref={setNodeRef}
        style={{
          ...style,
          position: 'relative',
          zIndex: 1,
          backgroundColor: '#333',
          lineHeight: 0,
          height: 2,
          width: 2,
          fontSize: 0,
          display: 'inline-block',
        }}
        {...listeners}
        {...attributes}
      >
        <div style={{ fontSize: 10 }}>Drag</div>
      </div>
    </div>
  );
};
