/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SnippetsDrawer } from '../panels/SnippetsDrawer';

describe('SnippetsDrawer', () => {
  it('renders entries and calls onInsert', async () => {
    const entries = [
      { name: 'A', prefix: 'a', body: 'console.log(1)', ref: 'global/test', group: 'global' },
      {
        name: 'B',
        prefix: 'b',
        body: 'console.log(2)',
        ref: 'scene/block/test',
        group: 'scene/block',
        groups: ['scene/block', 'scene/form'],
      },
    ];
    const onInsert = vi.fn();
    render(
      <SnippetsDrawer
        open
        onClose={() => {}}
        getContainer={() => document.body}
        entries={entries}
        tr={(s) => s}
        onInsert={onInsert}
      />,
    );

    // Expect both entries visible
    expect(await screen.findByText('A')).toBeTruthy();
    expect(await screen.findByText('B')).toBeTruthy();

    // Click first Insert
    const buttons = await screen.findAllByText('Insert');
    fireEvent.click(buttons[0]);
    expect(onInsert).toHaveBeenCalledTimes(1);
    // Body ends with newline when inserted
    expect(onInsert.mock.calls[0][0]).toMatch(/console\.log\(1\)\n?$/);
  });
});
