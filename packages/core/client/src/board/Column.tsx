import React, { forwardRef, useState, useEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Spin } from 'antd';
import { useKanbanBlockContext } from '../block-provider';
import Card from './Card';
import CardAdder from './CardAdder';
import { pickPropOut } from './utils';
import withDroppable from './withDroppable';
import { useAPIClient } from '../api-client';
import { useCollection } from '../collection-manager/hooks';
import { isAssocField } from '../filter-provider/utils';

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

const DroppableColumn = withDroppable(ColumnEmptyPlaceholder);

function Column({
  children,
  index: columnIndex,
  updateColumns,
  renderCard,
  renderCardAdder = ({ column, onConfirm }) => <CardAdder column={column} onConfirm={onConfirm} />,
  renderColumnHeader,
  disableColumnDrag,
  disableCardDrag,
  onCardNew,
  allowAddCard,
  cardAdderPosition = 'top',
}) {
  const { fixedBlock, groupField, field } = useKanbanBlockContext();
  const { name } = useCollection();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [cardData, setCardData] = useState(children.cards);
  const isAssociationField = isAssocField(groupField);
  const api = useAPIClient();
  useEffect(() => {
    if (updateColumns.length === 0 || updateColumns.includes(children.value)) {
      getColumnDatas();
    }
  }, [groupField, children.value, updateColumns]);

  const getColumnDatas = () => {
    if (children.value !== '__unknown__') {
      const filter = isAssociationField
        ? {
            $and: [{ [groupField.name]: { id: { $eq: children.value } } }],
          }
        : {
            $and: [{ [groupField.name]: { $eq: children.value } }],
          };
      api
        .resource(name)
        .list({
          filter: filter,
        })
        .then(({ data }) => {
          if (data) {
            setCardData(data?.data);
            children.cards = data?.data;
          }
        });
    }
  };
  return (
    <Draggable
      draggableId={`column-draggable-${children.value}`}
      index={columnIndex}
      isDragDisabled={disableColumnDrag}
    >
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
            data-testid={`column-${children.value}`}
          >
            <div
              ref={fixedBlock ? (ref) => setHeaderHeight(Math.ceil(ref?.getBoundingClientRect().height || 0)) : null}
              {...columnProvided.dragHandleProps}
            >
              {renderColumnHeader(children)}
            </div>
            {cardAdderPosition === 'top' && allowAddCard && renderCardAdder({ column: children, onConfirm: onCardNew })}
            <DroppableColumn droppableId={String(children.value)}>
              {cardData?.length ? (
                <div
                  className="react-kanban-card-skeleton"
                  style={{
                    height: fixedBlock ? '100%' : undefined,
                    minHeight: 50,
                  }}
                >
                  {cardData.map((card, index) => (
                    <Card
                      key={card.id}
                      index={index}
                      renderCard={(dragging) => {
                        return renderCard(children, new Proxy(card, {}), dragging, index);
                      }}
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
