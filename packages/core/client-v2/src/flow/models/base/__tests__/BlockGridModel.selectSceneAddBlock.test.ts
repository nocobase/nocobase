/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { BlockGridModel } from '../BlockGridModel';

class BlockModel extends FlowModel {}
BlockModel.define({ label: 'Other blocks' });

class DataBlockModel extends BlockModel {}
DataBlockModel.define({ label: 'Data blocks' });

class FilterBlockModel extends BlockModel {}
FilterBlockModel.define({ label: 'Filter blocks' });

class SelectTableBlockModel extends DataBlockModel {}
SelectTableBlockModel.define({ label: 'Table', children: false });

class SelectFilterBlockModel extends FilterBlockModel {}
SelectFilterBlockModel.define({ label: 'Filter', children: false });

class JSBlockModel extends BlockModel {}
JSBlockModel.define({ label: 'JS block' });

class IframeBlockModel extends BlockModel {}
IframeBlockModel.define({ label: 'Iframe' });

class MarkdownBlockModel extends BlockModel {}
MarkdownBlockModel.define({ label: 'Markdown' });

class ActionPanelBlockModel extends BlockModel {}
ActionPanelBlockModel.define({ label: 'Action panel' });

class ReferenceBlockModel extends BlockModel {}
ReferenceBlockModel.define({ label: 'Block template' });

describe('BlockGridModel - select scene add block menu', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({
      BlockModel,
      DataBlockModel,
      FilterBlockModel,
      BlockGridModel,
      SelectTableBlockModel,
      SelectFilterBlockModel,
      JSBlockModel,
      IframeBlockModel,
      MarkdownBlockModel,
      ActionPanelBlockModel,
      ReferenceBlockModel,
    });
  });

  it('keeps only JS, iframe and markdown under other blocks in select scene', async () => {
    engine.context.defineProperty('view', { value: { inputArgs: { scene: 'select' } } });
    const model = engine.createModel<BlockGridModel>({ use: 'BlockGridModel' });

    const itemsSource = model.addBlockItems;
    expect(typeof itemsSource).toBe('function');

    const items = await itemsSource!(model.context);
    const otherBlocks = items.find((item) => item.key === 'select-scene-other-blocks');

    expect(otherBlocks).toBeTruthy();
    expect(otherBlocks?.type).toBe('group');
    expect(Array.isArray(otherBlocks?.children)).toBe(true);

    const childKeys = (otherBlocks?.children as any[]).map((item) => item.key);
    expect(childKeys).toEqual(['JSBlockModel', 'IframeBlockModel', 'MarkdownBlockModel']);
    expect(childKeys).not.toContain('ActionPanelBlockModel');
    expect(childKeys).not.toContain('ReferenceBlockModel');
  });
});
