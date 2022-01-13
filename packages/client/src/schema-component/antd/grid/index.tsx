import React from 'react';
import { observer } from '@formily/react';
import { DndContext } from '../dnd-context';

export const Grid: any = observer((props) => {
  return (
    <div>
      <DndContext>{props.children}</DndContext>
    </div>
  );
});

Grid.Row = observer((props) => {
  return <div>{props.children}</div>;
});

Grid.Col = observer((props) => {
  return <div>{props.children}</div>;
});
