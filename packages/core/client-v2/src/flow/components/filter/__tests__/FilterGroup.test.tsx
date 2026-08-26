/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { type ReactElement } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { FilterGroup } from '../FilterGroup';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const renderWithProviders = (ui: ReactElement) => {
  return render(<ConfigProvider>{ui}</ConfigProvider>);
};

interface TestFilterItemProps {
  value: {
    path: string;
    operator: string;
    value: string;
  };
}

const DummyFilterItem: React.FC<TestFilterItemProps> = ({ value }) => (
  <div data-testid="dummy-filter-item">{value.path}</div>
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('FilterGroup closeIcon', () => {
  it('renders default CloseCircleOutlined icon when closeIcon is not provided', () => {
    const value = { logic: '$and', items: [] };

    renderWithProviders(<FilterGroup value={value} showBorder onRemove={vi.fn()} />);

    expect(screen.getByLabelText('close-circle')).toBeInTheDocument();
  });

  it('renders provided closeIcon for group and condition items', () => {
    const value = {
      logic: '$and',
      items: [
        {
          path: 'name',
          operator: 'eq',
          value: 'test',
        },
      ],
    };
    const customCloseIcon = <span data-testid="custom-close-icon">custom</span>;

    renderWithProviders(
      <FilterGroup
        value={value}
        FilterItem={DummyFilterItem}
        closeIcon={customCloseIcon}
        showBorder
        onRemove={vi.fn()}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId('custom-close-icon')).toHaveLength(2);
  });

  it('invokes onRemove when clicking the custom closeIcon for the group', () => {
    const value = { logic: '$and', items: [] };
    const onRemove = vi.fn();
    const customCloseIcon = <span data-testid="group-close-icon">close</span>;

    renderWithProviders(<FilterGroup value={value} closeIcon={customCloseIcon} showBorder onRemove={onRemove} />);

    fireEvent.click(screen.getByLabelText('icon-close'));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('removes condition item via closeIcon and triggers onChange', () => {
    const value = {
      logic: '$and',
      items: [
        {
          path: 'name',
          operator: 'eq',
          value: 'test',
        },
      ],
    };
    const onChange = vi.fn();
    const customCloseIcon = <span data-testid="item-close-icon">remove</span>;

    renderWithProviders(
      <FilterGroup value={value} FilterItem={DummyFilterItem} closeIcon={customCloseIcon} onChange={onChange} />,
    );

    fireEvent.click(screen.getByLabelText('icon-close'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(value.items).toHaveLength(0);
  });

  it('propagates changes from nested groups through onChange', () => {
    const value = {
      logic: '$and',
      items: [
        {
          logic: '$and',
          items: [],
        },
      ],
    };
    const onChange = vi.fn();

    renderWithProviders(<FilterGroup value={value} onChange={onChange} />);

    const groupHeaders = screen.getAllByText(/conditions in the group/);
    expect(groupHeaders.length).toBeGreaterThan(1);
    const nestedHeaderContainer = groupHeaders[1].closest('div');
    const nestedGroupRoot = nestedHeaderContainer?.parentElement;
    if (!nestedGroupRoot) {
      throw new Error('Nested group container not found');
    }

    const nestedAddConditionButton = within(nestedGroupRoot).getByText('Add condition');
    fireEvent.click(nestedAddConditionButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(value.items[0].items).toHaveLength(1);
  });
});
