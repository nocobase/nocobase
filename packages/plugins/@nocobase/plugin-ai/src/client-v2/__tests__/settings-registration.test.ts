/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { registerPluginAISettingsPages } from '../plugin';

describe('plugin-ai v2 settings registration', () => {
  it('registers AI settings menu and page tabs', () => {
    const addMenuItem = vi.fn();
    const addPageTabItem = vi.fn();

    registerPluginAISettingsPages(
      {
        addMenuItem,
        addPageTabItem,
      },
      (key) => `t:${key}`,
    );

    expect(addMenuItem).toHaveBeenCalledWith({
      key: 'ai',
      icon: 'TeamOutlined',
      title: 't:AI employees',
      aclSnippet: 'pm.ai',
      isPinned: true,
      sort: 400,
      showTabs: true,
    });
    expect(addPageTabItem).toHaveBeenCalledTimes(5);
    expect(addPageTabItem.mock.calls.map(([item]) => [item.menuKey, item.key, item.aclSnippet])).toEqual([
      ['ai', 'employees', 'pm.ai.employees'],
      ['ai', 'llm-services', 'pm.ai.llm-services'],
      ['ai', 'mcp-settings', 'pm.ai.mcp-settings'],
      ['ai', 'datasource', 'pm.ai.datasource'],
      ['ai', 'settings', 'pm.ai.settings'],
    ]);
    addPageTabItem.mock.calls.forEach(([item]) => {
      expect(item.componentLoader).toEqual(expect.any(Function));
    });
  });
});
