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
  const { component, style, children, openMode, ...others } = props;
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

const useSortableItemProps = (props) => {
  const id = useSortableItemId(props);
  if (props.schema) {
    return { ...props, id };
  }
  const schema = useFieldSchema();
  return { ...props, id, schema };
};

const useSortableItemId = (props) => {
  if (props.id) {
    return props.id;
  }
  const field = useField();
  return field.address.toString();
};

export const SortableItem: React.FC<any> = observer((props) => {
  const { schema, id, ...others } = useSortableItemProps(props);
  return (
    <SortableProvider id={id} data={{ insertAdjacent: 'afterEnd', schema: schema }}>
      <Sortable {...others}>{props.children}</Sortable>
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
