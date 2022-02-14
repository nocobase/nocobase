import { DndContext as DndKitContext, DragEndEvent, rectIntersection } from '@dnd-kit/core';
import { observer } from '@formily/react';
import React from 'react';
import { createDesignable, useDesignable } from '../../hooks';

const useDragEnd = () => {
  const { refresh } = useDesignable();

  return ({ active, over }: DragEndEvent) => {
    const activeSchema = active?.data?.current?.schema;
    const overSchema = over?.data?.current?.schema;
    const insertAdjacent = over?.data?.current?.insertAdjacent;
    const wrapSchema = over?.data?.current?.wrapSchema;

    if (!activeSchema || !overSchema) {
      return;
    }

    if (activeSchema === overSchema) {
      return;
    }

    const dn = createDesignable({
      current: overSchema,
    });

    dn.on('afterInsertAdjacent', refresh);
    dn.on('afterRemove', refresh);

    if (activeSchema.parent === overSchema.parent) {
      return dn.insertBeforeBeginOrAfterEnd(activeSchema);
    }

    if (insertAdjacent) {
      dn.insertAdjacent(insertAdjacent, activeSchema, {
        wrap: wrapSchema,
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
