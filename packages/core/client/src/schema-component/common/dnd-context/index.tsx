/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DndContext as DndKitContext, DragEndEvent, DragOverlay, rectIntersection } from '@dnd-kit/core';
import { Props } from '@dnd-kit/core/dist/components/DndContext/DndContext';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../';
import { createDesignable, useDesignable } from '../../hooks';

const useDragEnd = (onDragEnd) => {
  const { refresh } = useDesignable();
  const api = useAPIClient();
  const { t } = useTranslation();

  return useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const activeSchema = active?.data?.current?.schema;
      const overSchema = over?.data?.current?.schema;
      const insertAdjacent = over?.data?.current?.insertAdjacent;
      const breakRemoveOn = over?.data?.current?.breakRemoveOn;
      const wrapSchema = over?.data?.current?.wrapSchema;
      const onSuccess = over?.data?.current?.onSuccess;
      const removeParentsIfNoChildren = over?.data?.current?.removeParentsIfNoChildren ?? true;
      if (!activeSchema || !overSchema) {
        onDragEnd?.(event);
        return;
      }

      if (activeSchema === overSchema) {
        onDragEnd?.(event);
        return;
      }

      if (activeSchema.parent === overSchema && insertAdjacent === 'beforeEnd') {
        onDragEnd?.(event);
        return;
      }

      const dn = createDesignable({
        t,
        api,
        refresh: ({ refreshParentSchema = true } = {}) => refresh({ refreshParentSchema }),
        current: overSchema,
      });

      dn.loadAPIClientEvents();

      if (activeSchema.parent === overSchema.parent) {
        dn.insertBeforeBeginOrAfterEnd(activeSchema);
        onDragEnd?.(event);
        return;
      }

      if (insertAdjacent) {
        dn.insertAdjacent(insertAdjacent, activeSchema, {
          wrap: wrapSchema,
          breakRemoveOn,
          removeParentsIfNoChildren,
          onSuccess,
        });
        onDragEnd?.(event);
        return;
      }
    },
    [api, onDragEnd, refresh, t],
  );
};

export type DndContextProps = Props;

const InternalDndContext = React.memo((props: Props) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);

  const onDragStart = useCallback(
    (event) => {
      const { active } = event;
      const activeSchema = active?.data?.current?.schema;
      setVisible(!!activeSchema);
      if (props?.onDragStart) {
        props?.onDragStart?.(event);
      }
    },
    [props?.onDragStart],
  );

  const onDragEnd = useDragEnd(props?.onDragEnd);

  return (
    <DndKitContext collisionDetection={rectIntersection} {...props} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <DragOverlay
        dropAnimation={{
          duration: 10,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {visible && <span style={{ whiteSpace: 'nowrap' }}>{t('Dragging')}</span>}
      </DragOverlay>
      {props.children}
    </DndKitContext>
  );
});

InternalDndContext.displayName = 'InternalDndContext';

export const DndContext = (props: Props) => {
  return <InternalDndContext {...props} />;
};
