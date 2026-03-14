/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MultipleKeywordsInput } from '../MultipleKeywordsInput';

let xlsxModuleLoaded = false;

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@formily/react', () => ({
  useField: () => null,
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

describe('MultipleKeywordsInput', () => {
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
});
