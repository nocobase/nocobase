import React, { forwardRef, useState } from 'react';
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Table } from 'antd';
import { createContext } from 'react';
import { useContext } from 'react';
import { range } from 'lodash';
import parse from 'html-react-parser';
import cls from 'classnames';
import { MenuOutlined } from '@ant-design/icons';

import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { useRef } from 'react';
import { SortableItem } from '../../components/Sortable';

export const RowDraggableContext = createContext({});
export const ColDraggableContext = createContext(null);
export const CellContext = createContext(null);

export function SortableColumn(props) {
  const { className } = props;
  const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
    id: `droppable-${props['id']}`,
  });

  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
  } = useDraggable({
    id: `draggable-${props['id']}`,
  });

  return (
    <div
      {...props}
      className={cls(className, `draggable-${props['id']}`, {
        isOver,
        isDragging,
      })}
      ref={setDroppableNodeRef}
      // {...attributes}
    >
      <ColDraggableContext.Provider
        value={{ setDraggableNodeRef, attributes, listeners }}
      >
        {props.children}
      </ColDraggableContext.Provider>
      {/* <span ref={setDraggableNodeRef} {...attributes} {...listeners}>
        Drag
      </span> */}
    </div>
  );
}

export function SortableBodyRow(props: any) {
  const {
    className,
    style: prevStyle,
    ['data-row-key']: dataRowKey,
    ...others
  } = props;
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    setDraggableNodeRef,
    overIndex,
    transform,
    transition,
  } = useSortable({ id: dataRowKey });

  const style = {
    ...prevStyle,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <RowDraggableContext.Provider
      value={{ listeners, setDraggableNodeRef, attributes }}
    >
      <tr
        className={cls(
          { isDragging },
          props.className,
          `droppable-${props['data-row-key']}`,
        )}
        // className={cls(className)}
        ref={setNodeRef}
        {...others}
        {...attributes}
        style={style}
      >
        <SortableContext
          strategy={horizontalListSortingStrategy}
          items={React.Children.map(props.children, (child) => {
            console.log(child.key, 'child.key');
            return `td${child.key}`;
          })}
        >
          {React.Children.map(props.children, (child, index) => (
            <CellContext.Provider value={`td${child.key}`}>
              {child}
            </CellContext.Provider>
          ))}
        </SortableContext>
      </tr>
    </RowDraggableContext.Provider>
  );
}

export function SortableHeaderRow(props) {
  const [dragOverlayContent, setDragOverlayContent] = useState('');
  return (
    <tr {...props}>
      <DndContext
        onDragStart={(event) => {
          const previewRef = event.active.data?.current?.previewRef as {
            current: HTMLElement;
          };
          if (previewRef?.current) {
            setDragOverlayContent(previewRef.current.textContent || '');
          }
        }}
      >
        {createPortal(
          <DragOverlay style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            {dragOverlayContent}
          </DragOverlay>,
          document.body,
        )}
        {React.Children.map(props.children, (child, index) => (
          <CellContext.Provider value={child.key}>{child}</CellContext.Provider>
        ))}
      </DndContext>
    </tr>
  );
}

export function SortableHeaderCell(props) {
  const id = useContext(CellContext);
  if (['RC_TABLE_KEY', 'addnew'].includes(id)) {
    return <th {...props} />;
  }
  return (
    <SortableItem
      {...props}
      id={id}
      component={forwardRef<any>((props, ref) => (
        <th ref={ref} {...props} />
      ))}
    />
  );
}

export function SortableBodyCell(props) {
  const id = useContext(CellContext);
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    setDraggableNodeRef,
    setDroppableNodeRef,
    transform,
    transition,
  } = useSortable({ id: id });
  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <td
      ref={setDroppableNodeRef}
      {...props}
      className={cls({ isDragging }, props.className)}
      // {...attributes}
      // {...listeners}
      style={style}
    >
      <div style={{ height: 0, width: 0, opacity: 0, overflow: 'hidden' }}>
        <span ref={setDraggableNodeRef} {...attributes} {...listeners}>
          Drag
        </span>
      </div>
      {props.children}
    </td>
  );
}

export function SortableRowHandle(props) {
  const { className, ...others } = props;
  const { setDraggableNodeRef, attributes, listeners } =
    useContext<any>(RowDraggableContext);
  return setDraggableNodeRef ? (
    <MenuOutlined
      {...others}
      // ref={setDraggableNodeRef}
      // {...attributes}
      {...listeners}
      className={cls(`nb-table-sort-handle`, className)}
    />
  ) : null;
}
