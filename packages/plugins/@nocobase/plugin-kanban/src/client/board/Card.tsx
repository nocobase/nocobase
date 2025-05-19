/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useKeepAlive } from '@nocobase/client';
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

function Card({ children, index, renderCard, disableCardDrag }) {
  const { active: pageActive } = useKeepAlive();
  return (
    // react-beautiful-dnd uses document.querySelectorAll to get elements.
    // When the page is hidden, the entire DOM is also removed from the DOM tree, and elements cannot be obtained through document.querySelectorAll.
    // Therefore, when the page is hidden, drag and drop functionality must be disabled to prevent errors.
    <Draggable draggableId={String(children.id)} index={index} isDragDisabled={disableCardDrag || !pageActive}>
      {(provided, { isDragging }) => {
        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            data-testid={`card-${children.id}`}
          >
            {renderCard(isDragging)}
            {/* <div style={{ display: 'inline-block', whiteSpace: 'normal' }}></div> */}
          </div>
        );
      }}
    </Draggable>
  );
}

export default Card;
