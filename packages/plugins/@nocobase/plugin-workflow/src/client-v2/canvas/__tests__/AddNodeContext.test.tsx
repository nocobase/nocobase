/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { PresetDialogForm } from '../AddNodeContext';
import ConditionInstruction from '../../nodes/condition';
import MultiConditionsInstruction from '../../nodes/multi-conditions';

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string, options?: Record<string, unknown>) =>
    String(key)
      .replace(/\{\{t\("([^"]+)"(?:,\s*\{[^}]*\})?\)\}\}/g, (_match, text) => text)
      .replace(/\{\{(\w+)\}\}/g, (_match, name) => String(options?.[name] ?? `{{${name}}}`)),
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    DialogFormLayout: ({ children }: any) => <div>{children}</div>,
  };
});

describe('PresetDialogForm', () => {
  it('shows downstream-branch placement options after condition switches to yes/no branching', async () => {
    const instruction = new ConditionInstruction();

    render(
      <App>
        <PresetDialogForm instruction={instruction} hasDownstream onSubmit={vi.fn()} />
      </App>,
    );

    expect(screen.queryByText('Move all downstream nodes to')).not.toBeInTheDocument();

    fireEvent.click(await screen.findByRole('radio', { name: 'Branch into "Yes" and "No"' }));

    await waitFor(() => {
      expect(screen.getByText('Move all downstream nodes to')).toBeInTheDocument();
      expect(screen.getByText('After end of branches')).toBeInTheDocument();
      expect(screen.getByText('Inside of "Yes" branch')).toBeInTheDocument();
      expect(screen.getByText('Inside of "No" branch')).toBeInTheDocument();
    });
  });

  it('shows downstream-branch placement options immediately for multi-conditions when inserted before downstream nodes', async () => {
    const instruction = new MultiConditionsInstruction();

    render(
      <App>
        <PresetDialogForm instruction={instruction} hasDownstream onSubmit={vi.fn()} />
      </App>,
    );

    await waitFor(() => {
      expect(screen.getByText('Move all downstream nodes to')).toBeInTheDocument();
      expect(screen.getByText('After end of branches')).toBeInTheDocument();
      expect(screen.getByText('Inside of "First condition" branch')).toBeInTheDocument();
      expect(screen.getByText('Inside of "Otherwise" branch')).toBeInTheDocument();
    });
  });
});
