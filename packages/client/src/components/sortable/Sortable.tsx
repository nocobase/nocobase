import { DragOutlined } from '@ant-design/icons';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import cls from 'classnames';
import React, { createContext, forwardRef, useRef } from 'react';

const Div = forwardRef<HTMLDivElement>((props, ref) => {
  return <div ref={ref} {...props} />;
});

export interface SortableItemProps {}

export const SortableItemContext = createContext<any>({});

export function DragHandle(props) {
  const { component, ...others } = props;
  const Icon = component || DragOutlined;
  return (
    <SortableItemContext.Consumer>
      {({ draggable, setDraggableNodeRef, attributes, listeners }) =>
        setDraggableNodeRef && (
          <Icon
            ref={setDraggableNodeRef}
            {...others}
            // {...attributes}
            {...listeners}
          />
        )
      }
    </SortableItemContext.Consumer>
  );
}

export interface DroppableProps {
  id: any;
  data?: any;
  component?: any;
  [key: string]: any;
}

export function Droppable(props: DroppableProps) {
  const { id, data = {}, className, component, children, ...others } = props;
  const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
    id: `droppable-${id}`,
    data: {
      ...data,
    },
  });
  const Component = component || Div;
  return (
    <Component
      {...others}
      className={cls(className, `droppable droppable-${id}`, {
        isOver,
      })}
      ref={(el: HTMLElement) => {
        setDroppableNodeRef(el);
      }}
    >
      {children}
    </Component>
  );
}

export interface SortableItemProps {
  id: any;
  data?: any;
  component?: any;
  draggable?: boolean;
  [key: string]: any;
}

export function SortableItem(props: SortableItemProps) {
  const { id, data = {}, draggable, className, component, children, disabled, ...others } = props;
  const previewRef = useRef<HTMLElement>();
  const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
    id: `droppable-${id}`,
    data: {
      ...data,
      previewRef,
    },
    disabled,
  });
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
  } = useDraggable({
    id: `draggable-${id}`,
    disabled,
    data: {
      ...data,
      previewRef,
    },
  });
  if (draggable) {
    Object.assign(others, listeners);
  }
  const Component = component || Div;
  return (
    <Component
      {...others}
      // {...attributes}
      className={cls(className, `droppable droppable-${id}`, {
        isOver,
        isDragging,
      })}
      ref={(el: HTMLElement) => {
        previewRef.current = el;
        setDroppableNodeRef(el);
        // if (draggable) {
        // setDraggableNodeRef(el);
        // }
      }}
    >
      <SortableItemContext.Provider value={{ draggable, setDraggableNodeRef, attributes, listeners }}>
        {children}
      </SortableItemContext.Provider>
    </Component>
  );
}
