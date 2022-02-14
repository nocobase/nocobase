import { useDraggable, useDroppable } from '@dnd-kit/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext } from 'react';

export const DraggableContext = createContext(null);

export const Sortable = (props: any) => {
  const { id, data, style, children, ...others } = props;
  const draggable = useDraggable({
    id,
    data,
  });

  const { isOver, setNodeRef } = useDroppable({
    id,
    data,
  });

  const droppableStyle = { ...style };

  if (isOver) {
    droppableStyle['color'] = 'green';
  }

  return (
    <DraggableContext.Provider value={draggable}>
      <div {...others} ref={setNodeRef} style={droppableStyle}>
        {children}
      </div>
    </DraggableContext.Provider>
  );
};

export const SortableItem: React.FC<any> = observer((props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  return (
    <Sortable
      {...props}
      id={field.address.toString()}
      data={{ insertAdjacent: 'afterEnd', schema: fieldSchema }}
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
