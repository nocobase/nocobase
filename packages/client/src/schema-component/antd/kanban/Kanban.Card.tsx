import { createForm } from '@formily/core';
import { FieldContext, FormContext, observer } from '@formily/react';
import { Card } from 'antd';
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
          <Card style={{ width: 220, marginBottom: 15, cursor: 'pointer' }}>{children}</Card>
        </FormContext.Provider>
      </FieldContext.Provider>
    </BlockItem>
  );
});
