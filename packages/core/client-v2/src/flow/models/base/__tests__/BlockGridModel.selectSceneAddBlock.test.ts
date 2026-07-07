/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BlockGridModel,
  clearBlockGridSelectSceneAddBlockProviders,
  registerBlockGridSelectSceneAddBlockProvider,
} from '../BlockGridModel';

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
    clearBlockGridSelectSceneAddBlockProviders();
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

  afterEach(() => {
    clearBlockGridSelectSceneAddBlockProviders();
  });

  it('keeps only JS, iframe and markdown under other blocks in select scene', async () => {
    engine.context.defineProperty('view', { value: { inputArgs: { scene: 'select' } } });
    const model = engine.createModel<BlockGridModel>({ use: 'BlockGridModel' });

    const itemsSource = model.addBlockItems;
    expect(typeof itemsSource).toBe('function');
    if (typeof itemsSource !== 'function') {
      throw new Error('Expected select scene add-block items source');
    }

    const items = await itemsSource(model.context);
    const otherBlocks = items.find((item) => item.key === 'select-scene-other-blocks');

    expect(otherBlocks).toBeTruthy();
    expect(otherBlocks?.type).toBe('group');
    expect(Array.isArray(otherBlocks?.children)).toBe(true);

    const otherBlockChildren = Array.isArray(otherBlocks?.children) ? otherBlocks.children : [];
    const childKeys = otherBlockChildren.map((item) => item.key);
    expect(childKeys).toEqual(['JSBlockModel', 'IframeBlockModel', 'MarkdownBlockModel']);
    expect(childKeys).not.toContain('ActionPanelBlockModel');
    expect(childKeys).not.toContain('ReferenceBlockModel');
  });

  it('includes registered select-scene add-block provider groups', async () => {
    registerBlockGridSelectSceneAddBlockProvider('test-light-extension', () => [
      {
        key: 'select-scene-light-extension-js-blocks',
        type: 'group',
        label: 'From light extension',
        sort: 900,
        children: [
          {
            key: 'light-extension-js-block:entry_sales:pub_sales',
            label: 'Sales KPI',
            createModelOptions: {
              use: 'JSBlockModel',
              stepParams: {
                jsSettings: {
                  runJs: {
                    sourceMode: 'light-extension',
                    sourceBinding: {
                      type: 'light-extension-entry',
                      repoId: 'repo_sales',
                      entryId: 'entry_sales',
                      kind: 'js-block',
                      publicationId: 'pub_sales',
                      versionPolicy: 'pinned',
                    },
                    settings: {
                      title: 'Sales',
                    },
                  },
                },
              },
            },
          },
        ],
      },
    ]);
    engine.context.defineProperty('view', { value: { inputArgs: { scene: 'select' } } });
    const model = engine.createModel<BlockGridModel>({ use: 'BlockGridModel' });

    const itemsSource = model.addBlockItems;
    expect(typeof itemsSource).toBe('function');
    if (typeof itemsSource !== 'function') {
      throw new Error('Expected select scene add-block items source');
    }
    const items = await itemsSource(model.context);
    const providerGroup = items.find((item) => item.key === 'select-scene-light-extension-js-blocks');
    const providerGroupIndex = items.findIndex((item) => item.key === 'select-scene-light-extension-js-blocks');
    const otherBlocksIndex = items.findIndex((item) => item.key === 'select-scene-other-blocks');
    const leaf = Array.isArray(providerGroup?.children) ? providerGroup.children[0] : null;

    expect(providerGroup).toMatchObject({
      type: 'group',
      label: 'From light extension',
    });
    expect(providerGroupIndex).toBeLessThan(otherBlocksIndex);
    expect(leaf?.createModelOptions).toMatchObject({
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'light-extension',
            sourceBinding: {
              publicationId: 'pub_sales',
              versionPolicy: 'pinned',
            },
            settings: {
              title: 'Sales',
            },
          },
        },
      },
    });
  });

  it('includes registered light extension groups in regular block grids', async () => {
    registerBlockGridSelectSceneAddBlockProvider('test-light-extension', () => [
      {
        key: 'select-scene-light-extension-js-blocks',
        type: 'group',
        label: 'From light extension',
        sort: 900,
        children: [
          {
            key: 'light-extension-js-block:entry_sales:pub_sales',
            label: 'Sales KPI',
            createModelOptions: {
              use: 'JSBlockModel',
            },
          },
        ],
      },
    ]);
    engine.context.defineProperty('view', { value: { inputArgs: {} } });
    const model = engine.createModel<BlockGridModel>({ use: 'BlockGridModel' });

    const itemsSource = model.addBlockItems;
    expect(typeof itemsSource).toBe('function');
    if (typeof itemsSource !== 'function') {
      throw new Error('Expected regular add-block items source');
    }
    const items = await itemsSource(model.context);
    const providerGroup = items.find((item) => item.key === 'select-scene-light-extension-js-blocks');
    const dataBlocks = items.find((item) => item.key === 'DataBlockModel');
    const filterBlocks = items.find((item) => item.key === 'FilterBlockModel');

    expect(dataBlocks).toBeTruthy();
    expect(filterBlocks).toBeTruthy();
    expect(providerGroup).toMatchObject({
      type: 'group',
      label: 'From light extension',
    });
    expect(Array.isArray(providerGroup?.children)).toBe(true);
  });
});
