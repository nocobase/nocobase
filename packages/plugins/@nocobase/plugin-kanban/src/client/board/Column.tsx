import React, { forwardRef, useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { useKanbanBlockContext } from '../KanbanBlockProvider';
import Card from './Card';
import CardAdder from './CardAdder';
import { pickPropOut } from './utils';
import withDroppable from './withDroppable';

const ColumnEmptyPlaceholder = forwardRef(
  (
    props: {
      children: React.ReactNode;
      style?: React.CSSProperties;
    },
    ref: any,
  ) => {
    return (
      <div ref={ref} {...props} style={{ minHeight: 'inherit', height: 'var(--column-height)', ...props.style }} />
    );
  },
);
ColumnEmptyPlaceholder.displayName = 'ColumnEmptyPlaceholder';

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
  const { fixedBlock } = useKanbanBlockContext();
  const [headerHeight, setHeaderHeight] = useState(0);
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
              '--column-height': fixedBlock ? `calc(100% - ${headerHeight}px)` : 'inherit',
            }}
            className="react-kanban-column"
            data-testid={`column-${children.id}`}
          >
            <div
              ref={fixedBlock ? (ref) => setHeaderHeight(Math.ceil(ref?.getBoundingClientRect().height || 0)) : null}
              {...columnProvided.dragHandleProps}
            >
              {renderColumnHeader(children)}
            </div>
            {cardAdderPosition === 'top' && allowAddCard && renderCardAdder({ column: children, onConfirm: onCardNew })}
            <DroppableColumn droppableId={String(children.id)}>
              {children?.cards?.length ? (
                <div
                  className="react-kanban-card-skeleton"
                  style={{
                    height: fixedBlock ? '100%' : undefined,
                  }}
                >
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
