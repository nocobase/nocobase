/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DownloadTips, ImportWarning, initImportSettings } from '../importSupport';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('importSupport', () => {
  it('initializes import settings from selectable fields', () => {
    expect(
      initImportSettings([
        { name: 'title' },
        { name: 'author', children: [{ name: 'nickname' }] },
        { name: 'disabled', disabled: true },
      ]),
    ).toEqual({
      importColumns: [{ dataIndex: ['title'] }],
      explain: '',
    });

    expect(initImportSettings(undefined)).toEqual({
      importColumns: undefined,
      explain: '',
    });
  });

  it('renders import warning and download tips', () => {
    render(<ImportWarning />);
    expect(screen.getByText('Import warnings')).toBeTruthy();

    render(<DownloadTips />);
    expect(screen.getByText('Download tips')).toBeTruthy();
  });
});
