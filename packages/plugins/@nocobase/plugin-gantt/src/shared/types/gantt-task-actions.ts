/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BarTask } from './bar-task';

export type BarMoveAction = 'progress' | 'end' | 'start' | 'move';
export type GanttContentMoveAction =
  | 'mouseenter'
  | 'mouseleave'
  | 'delete'
  | 'dblclick'
  | 'click'
  | 'select'
  | ''
  | BarMoveAction;

export type GanttEvent = {
  changedTask?: BarTask;
  originalSelectedTask?: BarTask;
  action: GanttContentMoveAction;
};
