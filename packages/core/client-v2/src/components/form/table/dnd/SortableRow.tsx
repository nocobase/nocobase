/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MenuOutlined } from '@ant-design/icons';
import { TinyColor } from '@ctrl/tinycolor';
import { useSortable } from '@dnd-kit/sortable';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { DraggableAttributes } from '@dnd-kit/core';
import { css } from '@emotion/css';
import { theme } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';

type DragSortRowContextValue = {
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
  setActivatorNodeRef?: (node: HTMLElement | null) => void;
};

export const DragSortRowContext = React.createContext<DragSortRowContextValue | null>(null);

const sortHandleClass = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
`;

/**
 * Activator handle that initiates a row drag. Reads `attributes` / `listeners`
 * / `setActivatorNodeRef` from the surrounding `DragSortRowContext` provided
 * by `SortableRow`, so the handle can sit anywhere within the row's cells
 * (typically a dedicated first column).
 */
export const SortHandle: React.FC<{ id?: string | number; style?: React.CSSProperties }> = (props) => {
  const { id: _id, ...otherProps } = props;
  const dragSortContext = React.useContext(DragSortRowContext);
  return (
    <span
      ref={dragSortContext?.setActivatorNodeRef}
      {...dragSortContext?.attributes}
      {...dragSortContext?.listeners}
      {...otherProps}
      className={classNames(sortHandleClass)}
    >
      <MenuOutlined />
    </span>
  );
};

/**
 * Drop-in replacement for antd Table's `<tr>` body row that wires `useSortable`
 * keyed by the `data-row-key` attribute antd injects. Pass via
 * `Table.components.body.row` and wrap the `<tbody>` with `DndContext` +
 * `SortableContext`. The `DragSortRowContext` it provides lets `SortHandle`
 * be placed anywhere inside the row, not just on the row itself.
 */
export const SortableRow: React.FC<{
  rowIndex?: number;
  className?: string;
  [key: string]: any;
}> = (props) => {
  const { token }: any = theme.useToken();
  const id = props['data-row-key']?.toString();
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, active, over } = useSortable({
    id,
  });
  const { rowIndex, ...others } = props;
  const isOver = over?.id === id;
  const classObj = useMemo(() => {
    const borderColor = new TinyColor(token.colorPrimary).setAlpha(0.6).toHex8String();
    return {
      topActiveClass: css`
        & > td {
          border-top: 2px solid ${borderColor} !important;
        }
      `,
      bottomActiveClass: css`
        & > td {
          border-bottom: 2px solid ${borderColor} !important;
        }
      `,
    };
  }, [token.colorPrimary]);

  const className =
    (active?.data.current?.sortable.index ?? -1) > rowIndex ? classObj.topActiveClass : classObj.bottomActiveClass;

  return (
    <DragSortRowContext.Provider value={{ listeners, attributes, setActivatorNodeRef }}>
      <tr
        ref={(node) => {
          setNodeRef(node);
        }}
        {...others}
        className={classNames(props.className, { [className]: active && isOver })}
      />
    </DragSortRowContext.Provider>
  );
};
