import React, { useState } from 'react';
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Menu, Table, Tabs } from 'antd';
import { createContext } from 'react';
import { useContext } from 'react';
import { range } from 'lodash';
const RowSyntheticListenerMapContext = createContext(null);
const CellContext = createContext(null);
import cls from 'classnames';

import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { forwardRef } from 'react';
import { DragOutlined } from '@ant-design/icons';
import { useRef } from 'react';

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
            {...attributes}
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
      className={cls(className, `droppable-${id}`, {
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
  const {
    id,
    data = {},
    draggable,
    className,
    component,
    children,
    ...others
  } = props;
  const previewRef = useRef<HTMLElement>();
  const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
    id: `droppable-${id}`,
    data: {
      ...data,
      previewRef,
    },
  });
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
  } = useDraggable({
    id: `draggable-${id}`,
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
      className={cls(className, `droppable-${id}`, {
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
      <SortableItemContext.Provider
        value={{ draggable, setDraggableNodeRef, attributes, listeners }}
      >
        {children}
      </SortableItemContext.Provider>
    </Component>
  );
}
