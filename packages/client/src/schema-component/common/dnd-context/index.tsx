import { DndContext as DndKitContext, DragEndEvent } from '@dnd-kit/core';
import { observer } from '@formily/react';
import React from 'react';
import { createDesignable, useDesignable } from '../../hooks';

const useDragEnd = () => {
  const { refresh } = useDesignable();

  return ({ active, over }: DragEndEvent) => {
    console.log({ active, over });
    const activeSchema = active?.data?.current?.schema;
    const overSchema = over?.data?.current?.schema;
    const insertAdjacent = over?.data?.current?.insertAdjacent;
    const wrapSchema = over?.data?.current?.wrapSchema;
    const onInsertAdjacent = over?.data?.current?.onInsertAdjacent;

    if (!activeSchema || !overSchema) {
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
      console.log('removeIfChildrenEmpty', activeSchema);
      dn.insertAdjacent(insertAdjacent, activeSchema, {
        wrap: wrapSchema,
        removeEmptyParents: true,
      });
      // onInsertAdjacent && onInsertAdjacent({
      //   dn,
      //   orginDraggedParentSchema,
      //   draggedSchema: activeSchema,
      // });
      return;
    }
  };
};

export const DndContext = observer((props) => {
  return <DndKitContext onDragEnd={useDragEnd()}>{props.children}</DndKitContext>;
});
