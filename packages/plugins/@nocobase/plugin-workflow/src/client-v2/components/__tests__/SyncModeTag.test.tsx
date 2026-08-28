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
import { SyncModeTag } from '../SyncModeTag';

vi.mock('../../locale', () => ({
  useWorkflowTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('SyncModeTag', () => {
  it('renders synchronously with the v1 orange color', () => {
    render(<SyncModeTag value />);

    const tag = screen.getByText('Synchronously').closest('.ant-tag');
    expect(tag?.className).toContain('ant-tag-orange');
  });

  it('renders asynchronously with the v1 cyan color', () => {
    render(<SyncModeTag value={false} />);

    const tag = screen.getByText('Asynchronously').closest('.ant-tag');
    expect(tag?.className).toContain('ant-tag-cyan');
  });
});
