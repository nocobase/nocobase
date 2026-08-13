/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => holder.navigate,
  };
});

vi.mock('../locale', () => ({
  useWorkflowTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../canvas/CanvasContent', () => ({
  CanvasContent: () => null,
}));

vi.mock('../components/ExecutionViewHeader', () => ({
  ExecutionViewHeader: () => null,
}));

vi.mock('../components/JobResultModal', () => ({
  JobResultModal: () => null,
}));

import { ExecutionCanvas } from '../ExecutionCanvas';

describe('ExecutionCanvas', () => {
  it('navigates to the workflow list when the execution workflow does not exist', () => {
    render(<ExecutionCanvas record={{ id: 1, jobs: [] }} resource={{}} refresh={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Workflow list' }));

    expect(holder.navigate).toHaveBeenCalledWith('/admin/settings/workflow');
  });
});
