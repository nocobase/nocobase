/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { Tabs } from 'antd';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FilteredPageTabBar } from '../PageModelTabBar';

function StatefulContent() {
  const [value, setValue] = React.useState('Initial value');
  return <input aria-label="Tab draft" value={value} onChange={(event) => setValue(event.target.value)} />;
}

function renderTabs(hiddenTabKeys: Set<string>, onChange?: (activeKey: string) => void, activeKey = 'tab-hidden') {
  const items = [
    { key: 'tab-visible', label: 'Visible tab', children: 'Visible content' },
    { key: 'tab-hidden', label: 'Hidden tab', children: <StatefulContent /> },
  ];
  return (
    <Tabs
      activeKey={activeKey}
      onChange={onChange}
      items={items}
      renderTabBar={
        hiddenTabKeys.size > 0
          ? (tabBarProps) => (
              <FilteredPageTabBar
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
}

describe('FilteredPageTabBar', () => {
  it('removes hidden tabs from the real navigation model while retaining their active pane', () => {
    const hiddenTabKeys = new Set(['tab-hidden']);

    render(renderTabs(hiddenTabKeys));

    expect(screen.getByRole('tab', { name: 'Visible tab' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Hidden tab' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Tab draft' })).toBeVisible();
  });

  it('keeps the active pane mounted when its navigation entry becomes hidden', () => {
    const { rerender } = render(renderTabs(new Set()));
    const input = screen.getByRole('textbox', { name: 'Tab draft' });
    fireEvent.change(input, { target: { value: 'Unsaved value' } });

    rerender(renderTabs(new Set(['tab-hidden'])));

    expect(screen.queryByRole('tab', { name: 'Hidden tab' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Tab draft' })).toHaveValue('Unsaved value');
  });

  it('keeps visible navigation focusable and gives the hidden active pane an accessible name', () => {
    const onChange = vi.fn();
    render(renderTabs(new Set(['tab-hidden']), onChange));

    const visibleTab = screen.getByRole('tab', { name: 'Visible tab' });
    expect(visibleTab).toHaveAttribute('tabindex', '0');
    expect(visibleTab).toHaveAttribute('aria-selected', 'false');

    const activePanel = screen.getByRole('tabpanel');
    expect(activePanel).toHaveAccessibleName('Hidden tab');
    expect(document.getElementById(activePanel.getAttribute('aria-labelledby') || '')).not.toBeNull();
    expect(document.querySelectorAll('[role="tabpanel"]')).toHaveLength(1);

    fireEvent.focus(visibleTab);
    fireEvent.keyDown(visibleTab, { code: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('tab-visible');
  });

  it('connects a visible navigation entry to the pane owned by the outer Tabs instance', () => {
    render(renderTabs(new Set(['tab-hidden']), undefined, 'tab-visible'));

    const visibleTab = screen.getByRole('tab', { name: 'Visible tab' });
    const activePanel = screen.getByRole('tabpanel', { name: 'Visible tab' });
    expect(visibleTab).toHaveAttribute('aria-controls', activePanel.id);
    expect(activePanel).toHaveAttribute('aria-labelledby', visibleTab.id);
    expect(document.querySelectorAll(`#${CSS.escape(visibleTab.id)}`)).toHaveLength(1);
    expect(document.querySelectorAll('[role="tabpanel"]')).toHaveLength(1);
  });

  it('does not duplicate panes when a tab item requests forceRender', () => {
    const items = [
      { key: 'tab-visible', label: 'Visible tab', children: 'Visible content', forceRender: true },
      { key: 'tab-hidden', label: 'Hidden tab', children: 'Hidden content' },
    ];

    render(
      <Tabs
        activeKey="tab-visible"
        items={items}
        renderTabBar={(tabBarProps) => (
          <FilteredPageTabBar hiddenTabKeys={new Set(['tab-hidden'])} items={items} tabBarProps={tabBarProps} />
        )}
      />,
    );

    const activePanel = screen.getByRole('tabpanel', { name: 'Visible tab' });
    expect(document.querySelectorAll(`#${CSS.escape(activePanel.id)}`)).toHaveLength(1);
    expect(document.querySelectorAll('[role="tabpanel"]')).toHaveLength(1);
  });
});
