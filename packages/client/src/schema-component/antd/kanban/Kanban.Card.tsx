import { observer } from '@formily/react';
import React, { useContext } from 'react';
import { BlockItem } from '../block-item';
import { CardContext } from './context';

export const KanbanCard: any = observer((props: any) => {
  const { allowRemoveCard, onCardRemove, children } = props;
  const { card, dragging } = useContext(CardContext);
  return (
    <BlockItem className={'noco-card-item'}>
      <div className={`react-kanban-card ${dragging ? 'react-kanban-card--dragging' : ''}`}>
        <span>
          <div className="react-kanban-card__title">
            <span>{card.title}</span>
            {allowRemoveCard && (
              <span style={{ cursor: 'pointer' }} onClick={() => onCardRemove(card)}>
                ×
              </span>
            )}
          </div>
        </span>
        <div className="react-kanban-card__description">{children}</div>
      </div>
    </BlockItem>
  );
});
