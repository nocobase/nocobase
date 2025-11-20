/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { createPageTestHarness } from '../index';

function expectRootGrid(rootPage: any) {
  const grid = rootPage?.subModels?.grid ?? rootPage?.subModels?.tabs?.[0]?.subModels?.grid;
  expect(grid).toBeDefined();
  return grid;
}

describe('createPageTestHarness', () => {
  describe('basic usage', () => {
    it('should create an empty page', async () => {
      const harness = await createPageTestHarness();

      expect(harness).toBeDefined();
      expect(harness.getRootPageModel()).toBeDefined();
      expect(harness.getApp()).toBeDefined();
    });

    it('should create a page with a single Table block', async () => {
      const harness = await createPageTestHarness({
        blocks: [
          {
            type: 'Table',
            collection: 'users',
          },
        ],
      });

      const rootPage = harness.getRootPageModel();
      expect(rootPage).toBeDefined();

      // 应该有 grid 子模型（允许通过默认 Tab 提供）
      expectRootGrid(rootPage);

      // 检查区块配置
      const grid = expectRootGrid(rootPage);
      const gridItems = grid?.subModels?.items;
      expect(gridItems).toBeDefined();
      expect(Array.isArray(gridItems)).toBe(true);
      expect(gridItems?.length).toBeGreaterThan(0);
    });

    it('should create a page with mock data', async () => {
      const harness = await createPageTestHarness({
        blocks: [
          {
            type: 'Table',
            collection: 'users',
          },
        ],
        data: {
          users: [
            { id: 1, name: 'Alice', email: 'alice@test.com' },
            { id: 2, name: 'Bob', email: 'bob@test.com' },
          ],
        },
      });

      const rootPage = harness.getRootPageModel();
      expect(rootPage).toBeDefined();

      // 检查 grid 存在
      expectRootGrid(rootPage);
    });
  });

  describe('stepParams configuration', () => {
    it('should configure block with stepParams', async () => {
      const harness = await createPageTestHarness({
        blocks: [
          {
            type: 'Table',
            collection: 'users',
            stepParams: {
              default: {
                step1: {
                  dataSourceKey: 'main',
                  collectionName: 'users',
                },
              },
              tableSettings: {
                showIndex: true,
                pageSize: 20,
              },
            },
          },
        ],
      });

      const rootPage = harness.getRootPageModel();
      expect(rootPage).toBeDefined();
      expectRootGrid(rootPage);
    });

    it('should support simplified props that convert to stepParams', async () => {
      const harness = await createPageTestHarness({
        blocks: [
          {
            type: 'Table',
            collection: 'users',
            showIndex: true,
            pageSize: 20,
          },
        ],
      });

      const rootPage = harness.getRootPageModel();
      expect(rootPage).toBeDefined();
      expectRootGrid(rootPage);
    });

    it('should configure fields with stepParams', async () => {
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
                      title: '用户名',
                      required: true,
                    },
                  },
                },
              },
              'email', // 简化形式
            ],
          },
        ],
      });

      const rootPage = harness.getRootPageModel();
      expect(rootPage).toBeDefined();
      expectRootGrid(rootPage);
    });

    it('should configure actions with stepParams', async () => {
      const harness = await createPageTestHarness({
        blocks: [
          {
            type: 'Table',
            collection: 'users',
            actions: [
              {
                type: 'add',
                stepParams: {
                  default: {
                    step1: {
                      title: '添加用户',
                    },
                  },
                },
              },
              'delete', // 简化形式
            ],
          },
        ],
      });

      const rootPage = harness.getRootPageModel();
      expect(rootPage).toBeDefined();
      expectRootGrid(rootPage);
    });
  });

  describe('tabs configuration', () => {
    it('should create a page with multiple tabs', async () => {
      const harness = await createPageTestHarness({
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'Table',
                collection: 'users',
              },
            ],
          },
          {
            title: 'Details',
            blocks: [
              {
                type: 'Details',
                collection: 'users',
                recordId: 1,
              },
            ],
          },
        ],
      });

      const rootPage = harness.getRootPageModel();
      expect(rootPage).toBeDefined();
      expect(rootPage.subModels?.tabs).toHaveLength(2);
    });

    it('should configure tabs with stepParams', async () => {
      const harness = await createPageTestHarness({
        tabs: [
          {
            title: 'Overview',
            icon: 'UserOutlined',
            stepParams: {
              tabSettings: {
                icon: 'UserOutlined',
              },
            },
            blocks: [
              {
                type: 'Table',
                collection: 'users',
              },
            ],
          },
        ],
      });

      const rootPage = harness.getRootPageModel();
      expect(rootPage.subModels?.tabs).toHaveLength(1);
      const tab = rootPage.subModels.tabs[0];
      expect(tab.stepParams?.tabSettings?.icon).toBe('UserOutlined');
    });
  });

  describe('page configuration', () => {
    it('should configure page with stepParams', async () => {
      const harness = await createPageTestHarness({
        stepParams: {
          pageSettings: {
            hidePageTitle: false,
            enablePageTabs: true,
          },
        },
        blocks: [
          {
            type: 'Table',
            collection: 'users',
          },
        ],
      });

      const rootPage = harness.getRootPageModel();
      expect(rootPage.stepParams?.pageSettings).toEqual({
        hidePageTitle: false,
        enablePageTabs: true,
      });
    });

    it('should configure page title and config', async () => {
      const harness = await createPageTestHarness({
        pageTitle: 'User Management',
        pageConfig: {
          hidePageTitle: false,
          enablePageTabs: true,
        },
        blocks: [
          {
            type: 'Table',
            collection: 'users',
          },
        ],
      });

      const rootPage = harness.getRootPageModel();
      expect(rootPage.stepParams?.default?.step1?.title).toBe('User Management');
      expect(rootPage.stepParams?.default?.step1?.hidePageTitle).toBe(false);
      expect(rootPage.stepParams?.default?.step1?.enablePageTabs).toBe(true);
    });
  });

  describe('complex scenarios', () => {
    it('should create a complete page with tabs, blocks, and data', async () => {
      const harness = await createPageTestHarness({
        pageTitle: 'User Management',
        tabs: [
          {
            title: 'User List',
            blocks: [
              {
                type: 'Table',
                collection: 'users',
                stepParams: {
                  tableSettings: {
                    showIndex: true,
                    pageSize: 10,
                  },
                },
                columns: ['name', 'email'],
                actions: ['add', 'delete'],
              },
            ],
          },
          {
            title: 'User Details',
            blocks: [
              {
                type: 'Details',
                collection: 'users',
                recordId: 1,
                fields: ['name', 'email'],
              },
              {
                type: 'Form(Edit)',
                collection: 'users',
                recordId: 1,
                fields: [
                  {
                    name: 'name',
                    stepParams: {
                      default: {
                        step1: {
                          title: '用户名',
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
                          title: '邮箱',
                          required: false,
                        },
                      },
                    },
                  },
                ],
                actions: ['submit', 'cancel'],
              },
            ],
          },
        ],
        data: {
          users: [
            { id: 1, name: 'Alice', email: 'alice@test.com' },
            { id: 2, name: 'Bob', email: 'bob@test.com' },
          ],
        },
      });

      const rootPage = harness.getRootPageModel();
      expect(rootPage).toBeDefined();
      expect(rootPage.subModels?.tabs).toHaveLength(2);

      // 验证第一个 tab 有 grid
      const userListTab = rootPage.subModels.tabs[0];
      expect(userListTab.subModels?.grid).toBeDefined();
    });

    it('should support mixed simple and detailed configuration', async () => {
      const harness = await createPageTestHarness({
        blocks: [
          {
            type: 'Table',
            collection: 'users',
            // 简化配置
            showIndex: true,
            pageSize: 20,
            // 详细的 stepParams
            stepParams: {
              dataScope: {
                filter: {
                  status: { $eq: 'active' },
                },
              },
            },
            columns: ['name', 'email'],
            actions: ['add', 'delete'],
          },
        ],
      });

      const rootPage = harness.getRootPageModel();
      expect(rootPage).toBeDefined();
      expectRootGrid(rootPage);
    });
  });

  describe('utility methods', () => {
    it('should get root page model', async () => {
      const harness = await createPageTestHarness({
        blocks: [
          {
            type: 'Table',
            collection: 'users',
          },
        ],
      });

      const rootPage = harness.getRootPageModel();
      expect(rootPage).toBeDefined();
      expectRootGrid(rootPage);
    });

    it('should get tab models', async () => {
      const harness = await createPageTestHarness({
        tabs: [
          {
            title: 'Tab 1',
            key: 'tab1',
            blocks: [],
          },
          {
            title: 'Tab 2',
            key: 'tab2',
            blocks: [],
          },
        ],
      });

      const tab1 = harness.getTabModel('tab1');
      const tab2 = harness.getTabModel('Tab 2'); // 通过 title 查找

      expect(tab1).toBeDefined();
      expect(tab2).toBeDefined();
    });
  });
});
