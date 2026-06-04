/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MultipleKeywordsInput } from '../MultipleKeywordsInput';

let xlsxModuleLoaded = false;

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('xlsx', () => {
  xlsxModuleLoaded = true;
  return {
    read: vi.fn(),
    utils: {
      sheet_to_json: vi.fn(),
    },
  };
});

describe('MultipleKeywordsInput v2', () => {
  beforeEach(() => {
    xlsxModuleLoaded = false;
  });

  it('does not suspend or preload xlsx on initial render', () => {
    render(
      <React.Suspense fallback={<div data-testid="lazy-fallback">loading</div>}>
        <MultipleKeywordsInput fieldInterface="input" value={[]} />
      </React.Suspense>,
    );

    expect(screen.queryByTestId('lazy-fallback')).toBeNull();
    expect(screen.getByText('keywordsInputPlaceholder')).toBeTruthy();
    expect(screen.getByRole('button')).toBeTruthy();
    expect(xlsxModuleLoaded).toBe(false);
  });

  const enterKeyword = (value: string) => {
    const input = document.querySelector('.ant-select-selection-search-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  };

  const lastChangedValue = (onChange: ReturnType<typeof vi.fn>) => {
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    return lastCall?.[0];
  };

  it('keeps decimal values for number fields', async () => {
    const onChange = vi.fn();
    render(<MultipleKeywordsInput fieldInterface="number" value={[]} onChange={onChange} />);

    enterKeyword('1.25');

    await waitFor(() => {
      expect(lastChangedValue(onChange)).toEqual(['1.25']);
    });
  });

  it('keeps large integer values as strings for integer fields', async () => {
    const onChange = vi.fn();
    render(<MultipleKeywordsInput fieldInterface="integer" value={[]} onChange={onChange} />);

    enterKeyword('9007199254740993');

    await waitFor(() => {
      expect(lastChangedValue(onChange)).toEqual(['9007199254740993']);
    });
  });

  it('does not truncate decimal input for integer fields', async () => {
    const onChange = vi.fn();
    render(<MultipleKeywordsInput fieldInterface="integer" value={[]} onChange={onChange} />);

    enterKeyword('1.25');

    await waitFor(() => {
      expect(lastChangedValue(onChange)).toEqual([]);
    });
  });
});
