import { useDraggable, useDroppable } from '@dnd-kit/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext } from 'react';

export const DraggableContext = createContext(null);
export const SortableContext = createContext(null);

export const SortableProvider = (props) => {
  const { id, data, children } = props;
  const draggable = useDraggable({
    id,
    data,
  });
  const droppable = useDroppable({
    id,
    data,
  });
  return <SortableContext.Provider value={{ draggable, droppable }}>{children}</SortableContext.Provider>;
};

export const Sortable = (props: any) => {
  const { component, style, children, ...others } = props;
  const { droppable } = useContext(SortableContext);
  const { isOver, setNodeRef } = droppable;
  const droppableStyle = { ...style };

  if (isOver) {
    droppableStyle['color'] = 'rgba(241, 139, 98, .1)';
  }

  return React.createElement(
    component || 'div',
    {
      ...others,
      ref: setNodeRef,
      style: droppableStyle,
    },
    children,
  );
};

export const SortableItem: React.FC<any> = observer((props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  return (
    <SortableProvider id={field.address.toString()} data={{ insertAdjacent: 'afterEnd', schema: fieldSchema }}>
      <Sortable {...props}>{props.children}</Sortable>
    </SortableProvider>
  );
});

export const DragHandler = (props) => {
  const { draggable } = useContext(SortableContext);
  const { isDragging, attributes, listeners, setNodeRef, transform } = draggable;
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      style={{
        display: 'inline-block',
        width: 12,
        height: 12,
        lineHeight: '12px',
        textAlign: 'left',
      }}
    >
      <div
        ref={setNodeRef}
        style={{
          // ...style,
          position: 'relative',
          zIndex: 1,
          // backgroundColor: '#333',
          lineHeight: 0,
          height: 2,
          width: 2,
          fontSize: 0,
          display: 'inline-block',
        }}
        {...listeners}
        {...attributes}
      >
        <span style={{ cursor: 'move', fontSize: 14 }}>{props.children}</span>
      </div>
    </div>
  );
};
