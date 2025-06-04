/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TinyColor } from '@ctrl/tinycolor';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { cx } from '@emotion/css';
import { Schema, observer, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React, { HTMLAttributes, createContext, useContext, useMemo } from 'react';
import { useToken } from '../../antd/__builtins__';
import { useDesignable } from '../../hooks';

export const DraggableContext = createContext(null);
DraggableContext.displayName = 'DraggableContext';
export const SortableContext = createContext(null);
SortableContext.displayName = 'SortableContext';

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
  const value = useMemo(() => ({ draggable, droppable }), [draggable, droppable]);
  return <SortableContext.Provider value={value}>{children}</SortableContext.Provider>;
};

const getComputedColor = (color: string) => {
  return new TinyColor(color).setAlpha(0.15).toHex8String();
};

export const Sortable = (props: any) => {
  const { component, overStyle, style, children, openMode, ...others } = props;
  const { token } = useToken();
  const { draggable, droppable } = useContext(SortableContext);
  const { isOver, setNodeRef } = droppable;
  const droppableStyle = { ...style };
  const fieldSchema = useFieldSchema();
  const isLinkBtn = fieldSchema?.['x-component'] === 'Action.Link' || component === 'a';
  if (isOver && draggable?.active?.id !== droppable?.over?.id) {
    droppableStyle[isLinkBtn ? 'color' : 'background'] = getComputedColor(token.colorSettings);
    Object.assign(droppableStyle, overStyle);
  }

  return React.createElement(
    component || 'div',
    {
      role: 'none',
      ...others,
      className: cx('nb-sortable-designer', props.className),
      ref: setNodeRef,
      style: droppableStyle,
      setNodeRef,
    },
    children,
  );
};

const useSortableItemProps = (props) => {
  const id = useSortableItemId(props);
  const schema = useFieldSchema();
  if (props.schema) {
    return { ...props, id };
  }
  return { ...props, id, schema };
};

const useSortableItemId = (props) => {
  const field = useField();
  if (props.id) {
    return props.id;
  }
  return field.address?.toString();
};

interface SortableItemProps extends HTMLAttributes<HTMLDivElement> {
  eid?: string;
  schema?: Schema;
  removeParentsIfNoChildren?: boolean;
  component?: any;
}

const InternalSortableItem = observer(
  (props: SortableItemProps) => {
    const { schema, id, eid, removeParentsIfNoChildren, ...others } = useSortableItemProps(props);

    const data = useMemo(() => {
      return {
        insertAdjacent: 'afterEnd',
        schema,
        removeParentsIfNoChildren: removeParentsIfNoChildren ?? true,
      };
    }, [schema, removeParentsIfNoChildren]);

    return (
      <SortableProvider id={id} data={data}>
        <Sortable id={eid} {...others}>
          {props.children}
        </Sortable>
      </SortableProvider>
    );
  },
  { displayName: 'InternalSortableItem' },
);

export const SortableItem: React.FC<SortableItemProps> = React.memo((props) => {
  const { component, ...others } = props;
  const { designable } = useDesignable();

  if (designable) {
    return <InternalSortableItem {...props} />;
  }
  return React.createElement(
    component || 'div',
    _.omit(others, ['children', 'schema', 'overStyle', 'openMode', 'id', 'eid', 'removeParentsIfNoChildren']),
    props.children,
  );
});

SortableItem.displayName = 'SortableItem';

export const DragHandler = (props) => {
  const { draggable } = useContext(SortableContext) || {};

  if (!draggable) {
    return null;
  }

  const { attributes, listeners, setNodeRef } = draggable;

  return (
    <div
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        lineHeight: '14px',
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
        role="none"
      >
        <span style={{ cursor: 'move', fontSize: 14 }}>{props.children}</span>
      </div>
    </div>
  );
};
