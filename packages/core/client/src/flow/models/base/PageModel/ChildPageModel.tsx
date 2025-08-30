/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateModelOptions } from '@nocobase/flow-engine';
import { PageModel } from './PageModel';
import { DragEndEvent } from '@dnd-kit/core';

export class ChildPageModel extends PageModel {
  createPageTabModelOptions = (): CreateModelOptions => {
    return {
      use: 'ChildPageTabModel',
    };
  };

  async handleDragEnd(event: DragEndEvent) {
    if (!event.active?.id || !event.over?.id) {
      throw new Error('Invalid drag event');
    }

    this.flowEngine.moveModel(event.active.id, event.over.id);
  }
}
