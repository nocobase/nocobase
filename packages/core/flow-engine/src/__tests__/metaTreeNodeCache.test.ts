/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowContext } from '../flowContext';

describe('MetaTreeNode Cache Mechanism', () => {
  describe('Node-level Caching', () => {
    it('should return the same MetaTreeNode instance for the same property', () => {
      const ctx = new FlowContext();

      ctx.defineProperty('user', {
        meta: {
          type: 'object',
          title: 'User',
          properties: {
            name: { type: 'string', title: 'Name' },
          },
        },
      });

      // 获取两次相同的 meta tree
      const tree1 = ctx.getPropertyMetaTree();
      const tree2 = ctx.getPropertyMetaTree();

      // 应该返回相同的实例
      expect(tree1[0]).toBe(tree2[0]);
      expect(tree1[0].children?.[0]).toBe(tree2[0].children?.[0]);
    });

    it('should return the same MetaTreeNode for same meta objects', () => {
      const ctx = new FlowContext();

      // 创建可复用的 meta 对象
      const profileMeta = {
        type: 'object',
        title: 'Profile',
        properties: {
          bio: { type: 'string', title: 'Bio' },
        },
      };

      ctx.defineProperty('user', {
        meta: {
          type: 'object',
          title: 'User',
          properties: {
            profile: profileMeta,
          },
        },
      });

      ctx.defineProperty('admin', {
        meta: {
          type: 'object',
          title: 'Admin',
          properties: {
            profile: profileMeta, // 复用同一个 meta 对象
          },
        },
      });

      const tree = ctx.getPropertyMetaTree();

      // 找到 user.profile 和 admin.profile 节点
      const userProfileNode = (tree[0].children as any)?.[0];
      const adminProfileNode = (tree[1].children as any)?.[0];

      // 应该是同一个实例（因为使用相同的 meta 对象）
      expect(userProfileNode).toBe(adminProfileNode);
      expect(userProfileNode.title).toBe('Profile');
    });
  });

  describe('Async Meta Upgrade', () => {
    it('should upgrade async meta node in-place', async () => {
      const ctx = new FlowContext();

      const asyncMeta = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          type: 'object',
          title: 'Loaded User',
          properties: {
            name: { type: 'string', title: 'User Name' },
            email: { type: 'string', title: 'Email' },
          },
        };
      });

      ctx.defineProperty('user', { meta: asyncMeta });

      const tree = ctx.getPropertyMetaTree();
      const userNode = tree[0];

      // 初始状态：使用默认值
      expect(userNode.title).toBe('user'); // 默认使用 name
      expect(userNode.type).toBe('object');
      expect(typeof userNode.children).toBe('function');

      // 异步加载
      const children = await (userNode.children as () => Promise<any>)();

      // 验证原地更新：节点本身的属性被更新了
      expect(userNode.title).toBe('Loaded User'); // 已被更新
      expect(userNode.type).toBe('object');
      expect(userNode.children).toEqual(children); // children 被替换为实际结果

      // 验证子节点
      expect(children).toHaveLength(2);
      expect(children[0].name).toBe('name');
      expect(children[1].name).toBe('email');

      // 再次获取应该返回相同实例
      const tree2 = ctx.getPropertyMetaTree();
      expect(tree2[0]).toBe(userNode);
    });

    it('should handle async meta loading errors gracefully', async () => {
      const ctx = new FlowContext();

      const errorMeta = vi.fn(async () => {
        throw new Error('Meta loading failed');
      });

      ctx.defineProperty('errorProp', { meta: errorMeta });

      const tree = ctx.getPropertyMetaTree();
      const errorNode = tree[0];

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // 异步加载应该返回空数组
      const children = await (errorNode.children as () => Promise<any>)();
      expect(children).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load meta for errorProp:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Cache Invalidation', () => {
    it('should clear cache when property is redefined', () => {
      const ctx = new FlowContext();

      ctx.defineProperty('user', {
        meta: { type: 'string', title: 'User String' },
      });

      const tree1 = ctx.getPropertyMetaTree();
      expect(tree1[0].title).toBe('User String');

      // 重新定义属性
      ctx.defineProperty('user', {
        meta: { type: 'object', title: 'User Object' },
      });

      const tree2 = ctx.getPropertyMetaTree();
      expect(tree2[0].title).toBe('User Object');

      // 应该是不同的实例（缓存已清除）
      expect(tree1[0]).not.toBe(tree2[0]);
    });

    it('should preserve cache when delegate is added/removed', () => {
      const ctx1 = new FlowContext();
      const ctx2 = new FlowContext();

      ctx2.defineProperty('shared', {
        meta: { type: 'string', title: 'Shared Property' },
      });

      ctx1.defineProperty('own', {
        meta: { type: 'string', title: 'Own Property' },
      });

      const tree1 = ctx1.getPropertyMetaTree();
      expect(tree1).toHaveLength(1); // only 'own'
      const ownNode1 = tree1.find((n) => n.name === 'own');

      // 添加委托
      ctx1.addDelegate(ctx2);

      const tree2 = ctx1.getPropertyMetaTree();
      expect(tree2).toHaveLength(2); // 'own' + 'shared'

      // 验证缓存被保留了（'own' 是同一个实例）
      const ownNode2 = tree2.find((n) => n.name === 'own');
      expect(ownNode1).toBe(ownNode2);

      // 新的 'shared' 节点是首次创建
      const sharedNode = tree2.find((n) => n.name === 'shared');
      expect(sharedNode).toBeDefined();
      expect(sharedNode?.title).toBe('Shared Property');
    });
  });

  describe('Reference Stability', () => {
    it('should maintain reference stability across multiple calls', () => {
      const ctx = new FlowContext();

      ctx.defineProperty('stable', {
        meta: {
          type: 'object',
          title: 'Stable Node',
          properties: {
            child: { type: 'string', title: 'Child' },
          },
        },
      });

      // 多次调用应返回相同引用
      const calls = Array.from({ length: 5 }, () => ctx.getPropertyMetaTree());

      // 所有调用应返回相同的根节点实例
      const rootNodes = calls.map((tree) => tree[0]);
      rootNodes.forEach((node) => {
        expect(node).toBe(rootNodes[0]);
      });

      // 子节点也应该稳定
      const childNodes = calls.map((tree) => (tree[0].children as any)?.[0]);
      childNodes.forEach((node) => {
        expect(node).toBe(childNodes[0]);
      });
    });
  });
});
