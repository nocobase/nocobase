/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { useFlowEngine, useFlowModel } from '@nocobase/flow-engine';
import React, { FC } from 'react';

export const Sortable: FC<{ targetModelKey: string }> = (props) => {
  const model = useFlowModel();
  const items = model.mapSubModels(props.targetModelKey, (item) => item.uid);
  const engine = useFlowEngine();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // https://docs.dndkit.com/api-documentation/sensors/pointer#activation-constraints
        distance: 1,
      },
    }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    console.log('onDragEnd', active, over);
    if (active.id && over?.id && active.id !== over.id) {
      engine.getModel(active.id as string).moveTo(engine.getModel(over.id as string));
    }
  };

  return (
    <DndContext
      // 设置传感器
      sensors={sensors}
      // 使用 closestCenter 进行碰撞检测
      collisionDetection={closestCenter}
      // 限定只能在水平方向拖拽
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items}>{props.children}</SortableContext>
    </DndContext>
  );
};
