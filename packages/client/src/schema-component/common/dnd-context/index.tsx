import { DndContext as DndKitContext, DragEndEvent, rectIntersection } from '@dnd-kit/core';
import { observer } from '@formily/react';
import React from 'react';
import { useAPIClient } from '../../../';
import { createDesignable, useDesignable } from '../../hooks';

const useDragEnd = () => {
  const { refresh } = useDesignable();
  const api = useAPIClient();

  return ({ active, over }: DragEndEvent) => {
    const activeSchema = active?.data?.current?.schema;
    const overSchema = over?.data?.current?.schema;
    const insertAdjacent = over?.data?.current?.insertAdjacent;
    const breakRemoveOn = over?.data?.current?.breakRemoveOn;
    const wrapSchema = over?.data?.current?.wrapSchema;

    if (!activeSchema || !overSchema) {
      return;
    }

    if (activeSchema === overSchema) {
      return;
    }

    const dn = createDesignable({
      api,
      refresh,
      current: overSchema,
    });

    dn.loadAPIClientEvents();

    if (activeSchema.parent === overSchema.parent) {
      return dn.insertBeforeBeginOrAfterEnd(activeSchema);
    }

    if (insertAdjacent) {
      dn.insertAdjacent(insertAdjacent, activeSchema, {
        wrap: wrapSchema,
        breakRemoveOn,
        removeParentsIfNoChildren: true,
      });
      return;
    }
  };
};

export const DndContext = observer((props) => {
  return (
    <DndKitContext collisionDetection={rectIntersection} onDragEnd={useDragEnd()}>
      {props.children}
    </DndKitContext>
  );
});
