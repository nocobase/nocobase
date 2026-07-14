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
import LibTabs from 'antd/lib/tabs';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { FilteredPageTabBar } from '../PageModelTabBar';

function StatefulContent() {
  const [value, setValue] = React.useState('Initial value');
  return <input aria-label="Tab draft" value={value} onChange={(event) => setValue(event.target.value)} />;
}

function renderTabs(hiddenTabKeys: Set<string>) {
  return (
    <Tabs
      activeKey="tab-hidden"
      items={[
        { key: 'tab-visible', label: 'Visible tab', children: 'Visible content' },
        { key: 'tab-hidden', label: 'Hidden tab', children: <StatefulContent /> },
      ]}
      renderTabBar={(tabBarProps, DefaultTabBar) => (
        <FilteredPageTabBar hiddenTabKeys={hiddenTabKeys} tabBarProps={tabBarProps} DefaultTabBar={DefaultTabBar} />
      )}
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

  it('filters the navigation model when Tabs is loaded from the CommonJS entry', () => {
    render(
      <LibTabs
        activeKey="tab-hidden"
        items={[
          { key: 'tab-visible', label: 'CJS visible tab', children: 'CJS visible content' },
          { key: 'tab-hidden', label: 'CJS hidden tab', children: 'CJS hidden content' },
        ]}
        renderTabBar={(tabBarProps, DefaultTabBar) => (
          <FilteredPageTabBar
            hiddenTabKeys={new Set(['tab-hidden'])}
            tabBarProps={tabBarProps}
            DefaultTabBar={DefaultTabBar}
          />
        )}
      />,
    );

    expect(screen.getByRole('tab', { name: 'CJS visible tab' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'CJS hidden tab' })).not.toBeInTheDocument();
    expect(screen.getByText('CJS hidden content')).toBeVisible();
  });
});
