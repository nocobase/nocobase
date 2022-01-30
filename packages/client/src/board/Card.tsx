import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

function Card({ children, index, renderCard, disableCardDrag }) {
  return (
    <Draggable draggableId={String(children.id)} index={index} isDragDisabled={disableCardDrag}>
      {(provided, { isDragging }) => {
        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            data-testid={`card-${children.id}`}
          >
            <div style={{ display: 'inline-block', whiteSpace: 'normal' }}>{renderCard(isDragging)}</div>
          </div>
        );
      }}
    </Draggable>
  );
}

export default Card;
