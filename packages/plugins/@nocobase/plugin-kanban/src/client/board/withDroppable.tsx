/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import type { DroppableProps } from 'react-beautiful-dnd';

type WithDroppableProps = Omit<DroppableProps, 'children'> & {
  children: React.ReactNode;
};

function withDroppable(Component: React.ComponentType<any>) {
  const res = function WrapperComponent({
    children,
    ...restProps
  }: WithDroppableProps & React.HTMLAttributes<HTMLElement>) {
    const {
      droppableId,
      direction,
      type,
      isDropDisabled,
      isCombineEnabled,
      ignoreContainerClipping,
      renderClone,
      getContainerForClone,
      ...componentProps
    } = restProps;
    const droppableProps: Omit<DroppableProps, 'children'> = {
      droppableId,
      direction,
      type,
      isDropDisabled,
      isCombineEnabled,
      ignoreContainerClipping,
      renderClone,
      getContainerForClone,
    };
    return (
      <Droppable {...droppableProps}>
        {(provided) => (
          <Component ref={provided.innerRef} {...componentProps} {...provided.droppableProps}>
            {children}
            {provided.placeholder}
          </Component>
        )}
      </Droppable>
    );
  };
  res.displayName = `withDroppable(${Component.displayName || Component.name})`;
  return res;
}

export default withDroppable;
