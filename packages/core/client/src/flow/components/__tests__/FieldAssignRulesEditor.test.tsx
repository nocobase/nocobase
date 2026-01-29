/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App, ConfigProvider } from 'antd';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@nocobase/test/client';
import { FieldAssignRulesEditor, type FieldAssignRuleItem } from '../FieldAssignRulesEditor';

vi.mock('../FieldAssignValueInput', () => ({
  FieldAssignValueInput: () => <div data-testid="mock-value-input" />,
}));

describe('FieldAssignRulesEditor', () => {
  const t = (key: string) => key;
  const wrap = (ui: React.ReactElement) => (
    <ConfigProvider>
      <App>{ui}</App>
    </ConfigProvider>
  );

  it('defaults to expand the last enabled item', () => {
    const value: FieldAssignRuleItem[] = [
      { key: '1', enable: false, targetPath: 'a', mode: 'assign' },
      { key: '2', enable: true, targetPath: 'b', mode: 'assign' },
      { key: '3', enable: true, targetPath: 'c', mode: 'assign' },
    ];

    const { container } = render(
      wrap(<FieldAssignRulesEditor t={t} fieldOptions={[]} value={value} showCondition={false} />),
    );

    const active = container.querySelector('.ant-collapse-item-active');
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain('c');
  });

  it('falls back to expand the first item when all items are disabled', () => {
    const value: FieldAssignRuleItem[] = [
      { key: '1', enable: false, targetPath: 'a', mode: 'assign' },
      { key: '2', enable: false, targetPath: 'b', mode: 'assign' },
    ];

    const { container } = render(
      wrap(<FieldAssignRulesEditor t={t} fieldOptions={[]} value={value} showCondition={false} />),
    );

    const active = container.querySelector('.ant-collapse-item-active');
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain('a');
  });

  it('renders empty state when no items', () => {
    const { container } = render(
      wrap(<FieldAssignRulesEditor t={t} fieldOptions={[]} value={[]} showCondition={false} />),
    );

    expect(container.querySelector('.ant-collapse')).toBeNull();
    expect(container.textContent).toContain('No data');
  });
});
