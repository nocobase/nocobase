/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { StablePopover } from '../Popover';

describe('StablePopover', () => {
  it('renders above the containing popup layer', async () => {
    render(
      <div style={{ position: 'relative', zIndex: 5000 }}>
        <StablePopover open content={<div>Icon picker popup</div>}>
          <button type="button">Select icon</button>
        </StablePopover>
      </div>,
    );

    expect(screen.getByText('Icon picker popup')).toBeInTheDocument();

    await waitFor(() => {
      const popover = document.querySelector<HTMLElement>('.ant-popover');

      expect(popover).toBeInTheDocument();
      expect(Number(popover?.style.zIndex)).toBeGreaterThan(5000);
    });
  });
});
