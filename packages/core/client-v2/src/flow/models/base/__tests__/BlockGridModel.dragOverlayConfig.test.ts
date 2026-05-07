/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, LayoutSlot } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { BlockGridModel } from '../BlockGridModel';

describe('BlockGridModel dragOverlayConfig', () => {
  let model: BlockGridModel;

  beforeEach(() => {
    const engine = new FlowEngine();
    engine.registerModels({ BlockGridModel });
    model = engine.createModel<BlockGridModel>({ use: 'BlockGridModel' });
  });

  it('applies block insert overlay offsets from dragOverlayConfig', () => {
    const beforeSlot: LayoutSlot = {
      type: 'column',
      rowId: 'row1',
      columnIndex: 0,
      insertIndex: 0,
      position: 'before',
      rect: { top: 100, left: 50, width: 200, height: 48 },
    };
    const afterSlot: LayoutSlot = {
      type: 'column',
      rowId: 'row1',
      columnIndex: 0,
      insertIndex: 1,
      position: 'after',
      rect: { top: 300, left: 50, width: 200, height: 48 },
    };

    expect((model as any).computeOverlayRect(beforeSlot).top).toBe(88);
    expect((model as any).computeOverlayRect(afterSlot).top).toBe(312);
  });
});
