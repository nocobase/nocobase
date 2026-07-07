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
import { describe, expect, it } from 'vitest';
import { ActionPanelBadge } from '../ActionPanelBlockModel';

describe('ActionPanelBadge', () => {
  it('renders and clears the action panel badge around icon content', () => {
    const { rerender } = render(
      <ActionPanelBadge badge={{ count: 7, overflowCount: 99 }}>
        <span data-testid="action-icon" />
      </ActionPanelBadge>,
    );

    expect(screen.getByTestId('action-icon')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    rerender(
      <ActionPanelBadge badge={null}>
        <span data-testid="action-icon" />
      </ActionPanelBadge>,
    );

    expect(screen.getByTestId('action-icon')).toBeInTheDocument();
    expect(screen.queryByText('7')).not.toBeInTheDocument();
  });
});
