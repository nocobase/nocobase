/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import {
  AddSubModelButton,
  DragOverlayConfig,
  FlowSettingsButton,
  buildSubModelGroups,
  buildSubModelItems,
  type CreateModelOptions,
  type FlowModelContext,
  type SubModelItem,
  type SubModelItemsType,
} from '@nocobase/flow-engine';
import React from 'react';
import { FilterManager } from '../blocks/filter-manager/FilterManager';
import { GridModel } from './GridModel';

const SELECT_SCENE_ALLOWED_OTHER_BLOCK_MODELS = ['JSBlockModel', 'IframeBlockModel', 'MarkdownBlockModel'] as const;

export type BlockGridSelectSceneAddBlockProvider = (ctx: FlowModelContext) => SubModelItem[] | Promise<SubModelItem[]>;

const selectSceneAddBlockProviders = new Map<string, BlockGridSelectSceneAddBlockProvider>();

export function registerBlockGridSelectSceneAddBlockProvider(
  key: string,
  provider: BlockGridSelectSceneAddBlockProvider,
): () => void {
  selectSceneAddBlockProviders.set(key, provider);
  return () => {
    if (selectSceneAddBlockProviders.get(key) === provider) {
      selectSceneAddBlockProviders.delete(key);
    }
  };
}

export function clearBlockGridSelectSceneAddBlockProviders() {
  selectSceneAddBlockProviders.clear();
}

async function resolveSelectSceneExtensionItems(ctx: FlowModelContext): Promise<SubModelItem[]> {
  const items: SubModelItem[] = [];

  for (const [key, provider] of selectSceneAddBlockProviders) {
    try {
      const provided = await provider(ctx);
      if (Array.isArray(provided)) {
        items.push(...provided);
      }
    } catch (error) {
      console.error(`[NocoBase] Failed to resolve select scene add-block provider '${key}':`, error);
    }
  }

  return items.sort((a, b) => (a.sort ?? 1000) - (b.sort ?? 1000));
}

export class BlockGridModel extends GridModel {
  dragOverlayConfig: DragOverlayConfig = {
    // 列内插入
    columnInsert: {
      before: { offsetTop: -12 },
      after: { offsetTop: 12 },
    },
    // 列边缘
    columnEdge: {
      left: { offsetLeft: -5 },
      right: { offsetLeft: 6 },
    },
  };

  onInit(options: CreateModelOptions) {
    super.onInit(options);
    this.context.defineProperty('blockGridModel', {
      value: this,
    });
    this.context.defineProperty('filterManager', {
      once: true,
      get: () => {
        return new FilterManager(this, options['filterManager']);
      },
    });
  }

  get subModelBaseClasses() {
    const inputArgs = this.context.view?.inputArgs ?? {};
    if (inputArgs.collectionName && !inputArgs.filterByTk) {
      // 新增记录的场景，需要移除掉 筛选区块
      return ['DataBlockModel', 'FilterBlockModel', 'BlockModel'];
    }
    return ['DataBlockModel', 'FilterBlockModel', 'BlockModel'];
  }

  get filterManager(): FilterManager {
    return this.context.filterManager;
  }

  get addBlockItems(): SubModelItemsType | undefined {
    if (this.context.view?.inputArgs?.scene !== 'select') {
      return undefined;
    }

    return async (ctx) => {
      const items = await buildSubModelGroups(['DataBlockModel', 'FilterBlockModel'])(ctx);
      const extensionItems = await resolveSelectSceneExtensionItems(ctx);
      if (extensionItems.length > 0) {
        items.push(...extensionItems);
      }
      const allowedOtherBlockModels = SELECT_SCENE_ALLOWED_OTHER_BLOCK_MODELS.filter((modelName) =>
        Boolean(ctx.engine.getModelClass(modelName)),
      );
      const otherBlockItems = (
        await Promise.all(allowedOtherBlockModels.map((modelName) => buildSubModelItems(modelName)(ctx)))
      )
        .flat()
        .sort((a, b) => (a.sort ?? 1000) - (b.sort ?? 1000));

      if (otherBlockItems.length > 0) {
        items.push({
          key: 'select-scene-other-blocks',
          type: 'group',
          label: ctx.t('Other blocks'),
          sort: 1000,
          children: otherBlockItems,
        } satisfies SubModelItem);
      }

      return items.sort((a, b) => (a.sort ?? 1000) - (b.sort ?? 1000));
    };
  }

  serialize() {
    const data = super.serialize();
    data['filterManager'] = this.filterManager.getFilterConfigs();
    return data;
  }

  renderAddSubModelButton() {
    const items = this.addBlockItems;
    return (
      <AddSubModelButton
        model={this}
        subModelKey="items"
        items={items}
        subModelBaseClasses={items ? undefined : this.subModelBaseClasses}
      >
        <FlowSettingsButton icon={<PlusOutlined />} data-flow-add-block>
          {this.context.t('Add block')}
        </FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  render() {
    return (
      <div
        className="nb-block-grid"
        style={
          this.context.disableBlockGridPadding
            ? null
            : { padding: this.context.isMobileLayout ? 8 : this.context.themeToken.marginBlock, paddingBottom: 0 }
        }
      >
        {super.render()}
      </div>
    );
  }
}

BlockGridModel.registerFlow({
  key: 'blockGridSettings',
  steps: {
    grid: {
      handler(ctx, params) {
        ctx.model.setProps('rowGap', ctx.isMobileLayout ? 12 : ctx.themeToken.marginBlock);
        ctx.model.setProps('colGap', ctx.themeToken.marginBlock);
      },
    },
  },
});
