import React, { useContext, useState } from 'react';
import { observer, RecursionField } from '@formily/react';
import { Dropdown as AntdDropdown, Menu } from 'antd';
import { useDesignable, updateSchema } from '..';
import { findPropertyByPath } from '../../components/schema-renderer';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { ButtonComponentContext } from './context';

export const Dropdown = observer((props: any) => {
  const button = useContext(ButtonComponentContext);
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
      <AntdDropdown
        trigger={['hover']}
        {...props}
        overlay={
          <Menu>
            <RecursionField schema={schema} onlyRenderProperties />
          </Menu>
        }
      >
        <span>{button}</span>
      </AntdDropdown>
    </DndContext>
  );
});
