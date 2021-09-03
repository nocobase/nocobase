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
import {
  findPropertyByPath,
  getSchemaPath,
  useDesignable,
} from '../../components/schema-renderer';
import { updateSchema } from '..';
import { Schema } from '@formily/react';
import { isColumn, isColumnComponent } from '.';

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
  const { root, remove, insertAfter } = useDesignable();
  const moveToAfter = (path1, path2) => {
    if (!path1 || !path2) {
      return;
    }
    if (path1.join('.') === path2.join('.')) {
      return;
    }
    const data = findPropertyByPath(root, path1);
    if (!data) {
      return;
    }
    remove(path1);
    return insertAfter(data.toJSON(), path2);
  };
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
        onDragEnd={async (event) => {
          const path1 = event.active?.data?.current?.path;
          const path2 = event.over?.data?.current?.path;
          const data = moveToAfter(path1, path2);
          await updateSchema(data);
        }}
      >
        {createPortal(
          <DragOverlay
            dropAnimation={{
              duration: 10,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}
            style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
          >
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
  if (['RC_TABLE_KEY', 'addnew', 'operation'].includes(id)) {
    return <th {...props} />;
  }
  const { schema } = useDesignable();
  const columns: Schema[] = schema.reduceProperties((columns, current) => {
    if (!isColumn(current)) {
      return [...columns];
    }
    if (current.name === id) {
      return [...columns, current];
    }
    return [...columns];
  }, []);
  const column = columns.shift();
  if (!column) {
    return <th {...props} />;
  }
  return (
    <SortableItem
      {...props}
      id={id}
      data={{
        title: column.title,
        path: getSchemaPath(column),
      }}
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
