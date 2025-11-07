/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PageModel } from '../PageModel';
import { DragEndEvent } from '@dnd-kit/core';

// Mock FlowModel
vi.mock('@nocobase/flow-engine', () => ({
  FlowModel: class {
    static registerFlow() {}
  },
  escapeT: (str: string) => str,
}));

describe('PageModel', () => {
  let pageModel: PageModel;
  let mockDragEndEvent: DragEndEvent;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create PageModel instance
    pageModel = new PageModel({});

    // Mock DragEndEvent
    mockDragEndEvent = {
      active: {
        id: 'active-model-id',
        data: { current: {} },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'over-model-id',
        data: { current: {} },
        rect: {
          width: 100,
          height: 100,
          top: 0,
          left: 0,
          bottom: 100,
          right: 100,
        },
      },
      delta: { x: 0, y: 0 },
      collisions: null,
      activatorEvent: null,
    } as DragEndEvent;
  });

  describe('handleDragEnd', () => {
    it('should throw "Method not implemented." error', async () => {
      await expect(pageModel.handleDragEnd(mockDragEndEvent)).rejects.toThrow();
    });
  });
});
