import { createForm } from '@formily/core';
import { FieldContext, FormContext, observer } from '@formily/react';
import React, { useContext, useMemo } from 'react';
import { BlockItem } from '../block-item';
import { CardContext } from './context';

export const KanbanCard: any = observer((props: any) => {
  const { allowRemoveCard, onCardRemove, children } = props;
  const { card, dragging } = useContext(CardContext);
  const form = useMemo(
    () =>
      createForm({
        values: { card: { ...card } },
      }),
    [card],
  );
  return (
    <BlockItem className={'noco-card-item'}>
      <FieldContext.Provider value={undefined}>
        <FormContext.Provider value={form}>
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
        </FormContext.Provider>
      </FieldContext.Provider>
    </BlockItem>
  );
});
