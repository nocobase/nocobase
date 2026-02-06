/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MenuOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { css } from '@emotion/css';
import { TinyColor } from '@ctrl/tinycolor';
import classNames from 'classnames';
import React, { useMemo } from 'react';

const sortHandleClass = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  padding: 6px;
  margin: -6px;
`;

export const SortHandle: React.FC<{ id: string | number }> = (props) => {
  const { id, ...otherProps } = props;
  const { listeners, setNodeRef } = useSortable({
    id,
  });
  // return <MenuOutlined ref={setNodeRef} {...otherProps} {...listeners} style={{ cursor: 'grab' }} />;
  return (
    <span ref={setNodeRef} {...otherProps} {...listeners} className={classNames(sortHandleClass)}>
      <MenuOutlined />
    </span>
  );
};

export const SortableRow: React.FC<any> = (props) => {
  const id = props['data-row-key']?.toString();
  const { setNodeRef, active, over } = useSortable({
    id,
  });
  const { rowIndex, ...others } = props;
  const isOver = over?.id == id;

  const classObj = useMemo(() => {
    return {
      topActiveClass: css`
        & > td {
          border-top: 2px solid var(--colorSettings) !important;
        }
      `,
      bottomActiveClass: css`
        & > td {
          border-bottom: 2px solid var(--colorSettings) !important;
        }
      `,
    };
  }, []);

  const className =
    (active?.data.current?.sortable.index ?? -1) > rowIndex ? classObj.topActiveClass : classObj.bottomActiveClass;

  const row = (
    <tr
      ref={(node) => {
        if (active?.id !== id) {
          setNodeRef(node);
        }
      }}
      {...others}
      className={classNames(props.className, { [className]: active && isOver })}
    />
  );

  return row;
};
