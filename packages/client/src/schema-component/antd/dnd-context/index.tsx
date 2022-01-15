import { DndContext as DndKitContext, DragEndEvent } from '@dnd-kit/core';
import { observer } from '@formily/react';
import React from 'react';
import { createDesignable, useDesignable } from '../..';

const useDragEnd = () => {
  const { refresh } = useDesignable();

  return ({ active, over }: DragEndEvent) => {
    console.log({ active, over });
    const activeSchema = active?.data?.current?.schema;
    const overSchema = over?.data?.current?.schema;

    if (!activeSchema || !overSchema) {
      return;
    }

    const dn = createDesignable({
      current: overSchema,
    });

    dn.on('afterInsertAdjacent', refresh);
    dn.insertBeforeBeginOrAfterEnd(activeSchema);
  };
};

export const DndContext = observer((props) => {
  return <DndKitContext onDragEnd={useDragEnd()}>{props.children}</DndKitContext>;
});
