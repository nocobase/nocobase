import React, { forwardRef } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import Card from './Card';
import CardAdder from './CardAdder';
import { pickPropOut } from './utils';
import withDroppable from './withDroppable';

const ColumnEmptyPlaceholder = forwardRef((props, ref: any) => (
  <div ref={ref} style={{ minHeight: 'inherit', height: 'inherit' }} {...props} />
));

const DroppableColumn = withDroppable(ColumnEmptyPlaceholder);

function Column({
  children,
  index: columnIndex,
  renderCard,
  renderCardAdder = ({ column, onConfirm }) => <CardAdder column={column} onConfirm={onConfirm} />,
  renderColumnHeader,
  disableColumnDrag,
  disableCardDrag,
  onCardNew,
  allowAddCard,
  cardAdderPosition = 'top',
}) {
  return (
    <Draggable draggableId={`column-draggable-${children.id}`} index={columnIndex} isDragDisabled={disableColumnDrag}>
      {(columnProvided) => {
        const draggablePropsWithoutStyle = pickPropOut(columnProvided.draggableProps, 'style');

        return (
          <div
            ref={columnProvided.innerRef}
            {...draggablePropsWithoutStyle}
            style={{
              height: '100%',
              minHeight: '28px',
              display: 'inline-block',
              verticalAlign: 'top',
              ...columnProvided.draggableProps.style,
            }}
            className="react-kanban-column"
            data-testid={`column-${children.id}`}
          >
            <div {...columnProvided.dragHandleProps}>{renderColumnHeader(children)}</div>
            {cardAdderPosition === 'top' && allowAddCard && renderCardAdder({ column: children, onConfirm: onCardNew })}
            <DroppableColumn droppableId={String(children.id)}>
              {children?.cards?.length ? (
                <div className="react-kanban-card-skeleton">
                  {children.cards.map((card, index) => (
                    <Card
                      key={card.id}
                      index={index}
                      renderCard={(dragging) => renderCard(children, card, dragging)}
                      disableCardDrag={disableCardDrag}
                    >
                      {card}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="react-kanban-card-skeleton" />
              )}
            </DroppableColumn>
            {cardAdderPosition === 'bottom' &&
              allowAddCard &&
              renderCardAdder({ column: children, onConfirm: onCardNew })}
          </div>
        );
      }}
    </Draggable>
  );
}

export default Column;
