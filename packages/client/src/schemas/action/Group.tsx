import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { observer, RecursionField } from '@formily/react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Space } from 'antd';
import cls from 'classnames';
import { findPropertyByPath, getSchemaPath } from '../../components/schema-renderer';
import { useDesignable, updateSchema, removeSchema } from '..';
import { SortableItem } from '../../components/Sortable';

export const Group = observer((props: any) => {
  const { type = 'button' } = props;
  const { root, schema, insertAfter, remove } = useDesignable();
  const moveToAfter = (path1, path2) => {
    if (!path1 || !path2) {
      return;
    }
    if (path1.join('.') === path2.join('.')) {
      return;
    }
    const data = findPropertyByPath(root, path1);
    if (!data) {
      return;
    }
    remove(path1);
    return insertAfter(data.toJSON(), path2);
  };
  const [dragOverlayContent, setDragOverlayContent] = useState('');
  return (
    <DndContext
      onDragStart={(event) => {
        console.log({ event });
        setDragOverlayContent(event.active.data?.current?.title || '');
      }}
      onDragEnd={async (event) => {
        const path1 = event.active?.data?.current?.path;
        const path2 = event.over?.data?.current?.path;
        const data = moveToAfter(path1, path2);
        await updateSchema(data);
      }}
    >
      {createPortal(
        <DragOverlay
          zIndex={2222}
          style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
          dropAnimation={{
            duration: 10,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {dragOverlayContent}
        </DragOverlay>,
        document.body,
      )}
      <div className={cls(`ant-btn-group-${type}`)}>
        <Space size={16}>
          {schema.mapProperties((s) => {
            return (
              <SortableItem
                id={s.name}
                data={{
                  title: s.title,
                  path: getSchemaPath(s),
                }}
              >
                <RecursionField name={s.name} schema={s} />
              </SortableItem>
            );
          })}
        </Space>
      </div>
    </DndContext>
  );
});
