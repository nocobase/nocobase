/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { Tabs } from 'antd';
import React from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let IsolatedPageTabBar: (typeof import('../PageModelTabBar'))['FilteredPageTabBar'];

function StatefulContent() {
  const [value, setValue] = React.useState('Initial value');
  return <input aria-label="Tab draft" value={value} onChange={(event) => setValue(event.target.value)} />;
}

describe('FilteredPageTabBar module isolation', () => {
  beforeAll(async () => {
    vi.doMock('rc-tabs/es/TabContext', () => ({ default: React.createContext(undefined) }));
    vi.doMock('rc-tabs/lib/TabContext', () => ({ default: React.createContext(undefined) }));
    ({ FilteredPageTabBar: IsolatedPageTabBar } = await import('../PageModelTabBar'));
  });

  afterAll(() => {
    vi.doUnmock('rc-tabs/es/TabContext');
    vi.doUnmock('rc-tabs/lib/TabContext');
  });

  it('keeps filtering, focus, and aria behavior independent from direct rc-tabs contexts', () => {
    const onChange = vi.fn();
    const items = [
      { key: 'tab-visible', label: 'Visible tab', children: 'Visible content' },
      { key: 'tab-hidden', label: 'Hidden tab', children: 'Hidden content' },
    ];

    render(
      <Tabs
        activeKey="tab-hidden"
        items={items}
        onChange={onChange}
        renderTabBar={(tabBarProps) => (
          <IsolatedPageTabBar
            hiddenTabKeys={new Set(['tab-hidden'])}
            hiddenActiveTabLabel="Hidden tab"
            items={items}
            tabBarProps={tabBarProps}
          />
        )}
      />,
    );

    const visibleTab = screen.getByRole('tab', { name: 'Visible tab' });
    expect(visibleTab).toHaveAttribute('tabindex', '0');
    expect(visibleTab).toHaveAttribute('aria-selected', 'false');
    expect(screen.queryByRole('tab', { name: 'Hidden tab' })).not.toBeInTheDocument();
    expect(screen.getByText('Hidden content')).toBeVisible();

    const activePanel = screen.getByRole('tabpanel', { name: 'Hidden tab' });
    expect(document.getElementById(activePanel.getAttribute('aria-labelledby') || '')).not.toBeNull();

    fireEvent.focus(visibleTab);
    fireEvent.keyDown(visibleTab, { code: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('tab-visible');
  });

  it('keeps the hidden active pane mounted across the isolated navigation rerender', () => {
    const items = [
      { key: 'tab-visible', label: 'Visible tab', children: 'Visible content' },
      { key: 'tab-hidden', label: 'Hidden tab', children: <StatefulContent /> },
    ];
    const renderTabs = (hiddenTabKeys: Set<string>) => (
      <Tabs
        activeKey="tab-hidden"
        items={items}
        renderTabBar={
          hiddenTabKeys.size > 0
            ? (tabBarProps) => (
                <IsolatedPageTabBar
                  hiddenTabKeys={hiddenTabKeys}
                  hiddenActiveTabLabel="Hidden tab"
                  items={items}
                  tabBarProps={tabBarProps}
                />
              )
            : undefined
        }
      />
    );
    const { rerender } = render(renderTabs(new Set()));

    fireEvent.change(screen.getByRole('textbox', { name: 'Tab draft' }), { target: { value: 'Unsaved value' } });
    rerender(renderTabs(new Set(['tab-hidden'])));

    expect(screen.queryByRole('tab', { name: 'Hidden tab' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Tab draft' })).toHaveValue('Unsaved value');
  });

  it('keeps hidden entries out of the keyboard roving model', async () => {
    const items = [
      { key: 'tab-a', label: 'Visible A', children: 'Content A' },
      { key: 'tab-hidden', label: 'Hidden tab', children: 'Hidden content' },
      { key: 'tab-b', label: 'Visible B', children: 'Content B' },
    ];

    render(
      <Tabs
        activeKey="tab-a"
        items={items}
        renderTabBar={(tabBarProps) => (
          <IsolatedPageTabBar hiddenTabKeys={new Set(['tab-hidden'])} items={items} tabBarProps={tabBarProps} />
        )}
      />,
    );

    const firstTab = screen.getByRole('tab', { name: 'Visible A' });
    const secondTab = screen.getByRole('tab', { name: 'Visible B' });
    await act(async () => {
      firstTab.focus();
      fireEvent.keyDown(firstTab, { code: 'ArrowRight' });
    });

    expect(screen.queryByRole('tab', { name: 'Hidden tab' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(secondTab);
  });
});
