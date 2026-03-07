/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, userEvent, waitFor, within } from '@nocobase/test/client';
import React, { useState } from 'react';
import { SchemaComponentProvider } from '../../../';
import { DateFilterDynamicComponent } from '../DateFilterDynamicComponent';

const TestApp = ({ initialValue }) => {
  const [value, setValue] = useState(initialValue);

  return (
    <SchemaComponentProvider>
      <DateFilterDynamicComponent value={value} onChange={setValue} />
      <pre data-testid="current-value">{JSON.stringify(value)}</pre>
    </SchemaComponentProvider>
  );
};

const openTypeSelect = async (container: HTMLElement) => {
  const selector = within(container).getByTestId('date-filter-type-select').querySelector('.ant-select-selector');
  await userEvent.click(selector as HTMLElement);
};

const openUnitSelect = async (container: HTMLElement) => {
  const selector = within(container).getByTestId('date-filter-unit-select').querySelector('.ant-select-selector');
  await userEvent.click(selector as HTMLElement);
};

describe('DateFilterDynamicComponent', () => {
  it('should only show includeCurrent option for past and next', async () => {
    const { container } = render(<TestApp initialValue={{ type: 'today' }} />);

    await openTypeSelect(container);
    expect(screen.queryByTestId('include-current-checkbox')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Past'));
    await waitFor(() => expect(screen.getByTestId('include-current-checkbox')).toBeInTheDocument());
    expect(screen.getByRole('checkbox', { name: 'Include today' })).not.toBeChecked();
    expect(screen.getByTestId('current-value')).toHaveTextContent('"type":"past"');
    expect(screen.getByTestId('current-value')).toHaveTextContent('"number":1');
    expect(screen.getByTestId('current-value')).toHaveTextContent('"unit":"day"');
  });

  it('should keep includeCurrent and update label when unit changes', async () => {
    const { container } = render(<TestApp initialValue={{ type: 'past', number: 1, unit: 'day' }} />);

    await userEvent.click(screen.getByTestId('include-current-checkbox'));
    await waitFor(() => expect(screen.getByTestId('current-value')).toHaveTextContent('"includeCurrent":true'));

    await openUnitSelect(container);
    await userEvent.click(screen.getByText('Calendar week'));

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Include this week' })).toBeInTheDocument());
    expect(screen.getByRole('checkbox', { name: 'Include this week' })).toBeChecked();
    expect(screen.getByTestId('current-value')).toHaveTextContent('"unit":"week"');
  });

  it('should clear includeCurrent when switching to a fixed shortcut', async () => {
    const { container } = render(
      <TestApp initialValue={{ type: 'past', number: 1, unit: 'month', includeCurrent: true }} />,
    );

    await openTypeSelect(container);
    await userEvent.click(screen.getByText('Today'));

    await waitFor(() => expect(screen.getByTestId('current-value')).toHaveTextContent('{"type":"today"}'));
    expect(screen.getByTestId('current-value')).not.toHaveTextContent('includeCurrent');
  });
});
