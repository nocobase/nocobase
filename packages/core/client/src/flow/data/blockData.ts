/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IFlowModelRepository } from '@nocobase/flow-engine';

export interface BlockFlowConfig {
  uid: string;
}

class BlockStore {
  private data: Map<string, BlockFlowConfig> = new Map();

  // 模拟数据
  constructor() {
    // 预设一些示例数据
    const sampleData: BlockFlowConfig[] = [{ uid: 'block-1' }, { uid: 'block-2' }];

    sampleData.forEach((item) => {
      this.data.set(item.uid, item);
    });
  }

  create(): BlockFlowConfig {
    const uid = `block-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    const config: BlockFlowConfig = { uid };

    this.data.set(uid, config);
    console.log('BlockStore: Created', config);
    return config;
  }

  get(filter?: { uid?: string }): BlockFlowConfig[] {
    if (filter?.uid) {
      const item = this.data.get(filter.uid);
      console.log('BlockStore: Get by uid', { uid: filter.uid, found: !!item });
      return item ? [item] : [];
    }

    const allItems = Array.from(this.data.values());
    console.log('BlockStore: Get all', { count: allItems.length });
    return allItems;
  }

  update(uid: string, updates?: Partial<BlockFlowConfig>): BlockFlowConfig | undefined {
    const existing = this.data.get(uid);
    if (!existing) {
      console.log('BlockStore: Item not found for update', uid);
      return undefined;
    }

    // 由于 BlockFlowConfig 只有 uid，没有其他字段需要更新
    console.log('BlockStore: Item exists', existing);
    return existing;
  }

  delete(uid: string): boolean {
    const deleted = this.data.delete(uid);
    console.log('BlockStore: Deleted', { uid, success: deleted });
    return deleted;
  }
}

// 全局实例
const blockStore = new BlockStore();

// 导出 CRUD 函数
export const createBlock = () => blockStore.create();

export const getBlocks = (filter?: { uid?: string }) => blockStore.get(filter);

export const updateBlock = (uid: string, updates?: Partial<BlockFlowConfig>) => blockStore.update(uid, updates);

export const deleteBlock = (uid: string) => blockStore.delete(uid);

// 实现 IFlowModelRepository 接口
export class BlockFlowModelRepository implements IFlowModelRepository {
  async load(uid: string): Promise<any> {
    const configs = getBlocks({ uid });
    if (configs.length === 0) {
      throw new Error(`Block not found: ${uid}`);
    }

    const config = configs[0];
    return {
      uid: config.uid,
      stepParams: {
        defaultFlow: {
          setBlockInfo: {
            type: 'text',
            content: `Block ${uid}`,
          },
        },
      },
    };
  }

  async save(model: any): Promise<any> {
    // 由于 BlockFlowConfig 只有 uid，不需要保存其他数据
    console.log('BlockFlowModelRepository: Save called for', model.uid);
    return model;
  }

  async destroy(uid: string): Promise<boolean> {
    const success = deleteBlock(uid);
    return success;
  }
}
