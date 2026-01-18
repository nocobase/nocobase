/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createPageTestHarness } from '../index';

/**
 * 这是一个示例文件，展示如何在实际项目中使用 Page Test Harness
 */

describe('Page Test Harness usage examples', () => {
  /**
   * 示例 1: 测试用户列表页面
   */
  it('should render user list page with table', async () => {
    const harness = await createPageTestHarness({
      pageTitle: 'User management',
      blocks: [
        {
          type: 'Table',
          collection: 'users',
          columns: ['name', 'email', 'role'],
          actions: ['add', 'edit', 'delete'],
        },
      ],
      data: {
        users: [
          { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin' },
          { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user' },
        ],
      },
    });

    await harness.render();

    // 验证页面标题
    const rootPage = harness.getRootPageModel();
    expect(rootPage).toBeDefined();

    const defaultTab = harness.getTabModel('User management');
    expect(defaultTab).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('bob@test.com')).toBeInTheDocument();
    });
  });

  /**
   * 示例 2: 测试多标签页面
   */
  it('should render page with multiple tabs', async () => {
    const harness = await createPageTestHarness({
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              type: 'Table',
              collection: 'users',
              columns: ['name', 'email'],
            },
          ],
        },
        {
          title: 'Statistics',
          blocks: [
            {
              type: 'Chart',
              collection: 'users',
            },
          ],
        },
      ],
      data: {
        users: [{ id: 1, name: 'Alice', email: 'alice@test.com' }],
      },
    });

    await harness.render();

    const overviewTab = harness.getTabModel('Overview');
    const statisticsTab = harness.getTabModel('Statistics');

    expect(overviewTab).toBeDefined();
    expect(statisticsTab).toBeDefined();
  });

  /**
   * 示例 3: 测试表单页面
   */
  it('should render form page with fields', async () => {
    const harness = await createPageTestHarness({
      blocks: [
        {
          type: 'Form(Add new)',
          collection: 'users',
          fields: [
            {
              name: 'name',
              stepParams: {
                default: {
                  step1: {
                    title: 'Name',
                    required: true,
                  },
                },
              },
            },
            {
              name: 'email',
              stepParams: {
                default: {
                  step1: {
                    title: 'Email',
                    required: true,
                  },
                },
              },
            },
          ],
          actions: ['submit', 'cancel'],
        },
      ],
    });

    await harness.render();

    const rootPage = harness.getRootPageModel();
    expect(rootPage).toBeDefined();
  });

  /**
   * 示例 4: 测试详情页面
   */
  it('should render details page with specific record', async () => {
    const harness = await createPageTestHarness({
      blocks: [
        {
          type: 'Details',
          collection: 'users',
          recordId: 1,
          fields: ['name', 'email', 'role', 'createdAt'],
        },
      ],
      data: {
        users: [
          {
            id: 1,
            name: 'Alice',
            email: 'alice@test.com',
            role: 'admin',
            createdAt: '2024-01-01',
          },
        ],
      },
    });

    await harness.render();

    const rootPage = harness.getRootPageModel();
    expect(rootPage).toBeDefined();
  });

  /**
   * 示例 5: 测试复杂页面（多个区块 + 自定义配置）
   */
  it('should render complex page with multiple blocks', async () => {
    const harness = await createPageTestHarness({
      pageTitle: 'User dashboard',
      tabs: [
        {
          title: 'User list',
          blocks: [
            {
              type: 'Filter form',
              collection: 'users',
              fields: ['name', 'role'],
            },
            {
              type: 'Table',
              collection: 'users',
              columns: ['name', 'email', 'role'],
              actions: ['add', 'edit', 'delete'],
              stepParams: {
                tableSettings: {
                  showIndex: true,
                  pageSize: 20,
                },
              },
            },
          ],
        },
        {
          title: 'Statistics',
          blocks: [
            {
              type: 'Chart',
              collection: 'users',
              stepParams: {
                chartSettings: {
                  type: 'bar',
                  xField: 'role',
                  yField: 'count',
                },
              },
            },
          ],
        },
      ],
      data: {
        users: [
          { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin' },
          { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user' },
          { id: 3, name: 'Charlie', email: 'charlie@test.com', role: 'user' },
        ],
      },
    });

    await harness.render();

    const rootPage = harness.getRootPageModel();
    expect(rootPage).toBeDefined();

    // 验证标签页
    const userListTab = harness.getTabModel('User list');
    const statisticsTab = harness.getTabModel('Statistics');

    expect(userListTab).toBeDefined();
    expect(statisticsTab).toBeDefined();
  });

  /**
   * 示例 6: 使用简化语法
   */
  it('should support simplified syntax', async () => {
    const harness = await createPageTestHarness({
      blocks: [
        'users', // 最简形式，自动创建 Table 区块
        {
          collection: 'orders', // 只指定 collection
        },
        {
          type: 'Details',
          collection: 'settings',
          recordId: 1,
        },
      ],
      data: {
        users: [{ id: 1, name: 'Alice' }],
        orders: [{ id: 1, orderNo: '001' }],
        settings: [{ id: 1, key: 'theme' }],
      },
    });

    await harness.render();

    const rootPage = harness.getRootPageModel();
    expect(rootPage).toBeDefined();
  });
});
