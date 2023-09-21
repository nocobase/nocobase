import { TinyColor } from '@ctrl/tinycolor';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { cx } from '@emotion/css';
import { Schema, observer, useField, useFieldSchema } from '@formily/react';
import React, { HTMLAttributes, createContext, useContext } from 'react';
import { useToken } from '../../antd/__builtins__';

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
  const { component, overStyle, style, children, openMode, ...others } = props;
  const { token } = useToken();
  const { draggable, droppable } = useContext(SortableContext);
  const { isOver, setNodeRef } = droppable;
  const droppableStyle = { ...style };

  if (isOver && draggable?.active?.id !== droppable?.over?.id) {
    droppableStyle[component === 'a' ? 'color' : 'background'] = new TinyColor(token.colorSettings)
      .setAlpha(0.15)
      .toHex8String();
    Object.assign(droppableStyle, overStyle);
  }

  return React.createElement(
    component || 'div',
    {
      ...others,
      className: cx('nb-sortable-designer', props.className),
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

interface SortableItemProps extends HTMLAttributes<HTMLDivElement> {
  eid?: string;
  schema?: Schema;
  removeParentsIfNoChildren?: boolean;
}

export const SortableItem: React.FC<SortableItemProps> = observer(
  (props) => {
    const { schema, id, eid, removeParentsIfNoChildren, ...others } = useSortableItemProps(props);
    return (
      <SortableProvider
        id={id}
        data={{
          insertAdjacent: 'afterEnd',
          schema: schema,
          removeParentsIfNoChildren: removeParentsIfNoChildren ?? true,
        }}
      >
        <Sortable id={eid} {...others}>
          {props.children}
        </Sortable>
      </SortableProvider>
    );
  },
  { displayName: 'SortableItem' },
);

export const DragHandler = (props) => {
  const { draggable } = useContext(SortableContext);
  const { attributes, listeners, setNodeRef } = draggable;

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
