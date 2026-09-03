/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkflowDetailsModal } from '../WorkflowDetailsModal';

vi.mock('../../canvas/style', () => ({
  default: () => ({
    styles: {
      workflowDetailsDescriptionClass: 'workflow-details-description',
    },
  }),
}));

vi.mock('../../locale', () => ({
  useWorkflowTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('WorkflowDetailsModal', () => {
  const record = {
    id: 11,
    key: 'k0vffw52ic5',
    description: '123',
    createdBy: null,
    updatedBy: { nickname: 'Super Admin' },
    createdAt: '2026-06-16T06:58:57.000Z',
    updatedAt: '2026-06-16T07:03:56.000Z',
  } as any;

  it('renders an editable textarea with the shared hover/focus style class', () => {
    render(
      <WorkflowDetailsModal
        record={record}
        open
        onClose={() => undefined}
        resource={{ update: vi.fn() }}
        refresh={() => undefined}
      />,
    );

    const textarea = screen.getByRole('textbox', { name: 'Description' });
    expect(textarea).toHaveValue('123');
    expect(textarea).toHaveAttribute('placeholder', '-');
    expect(textarea.className).toContain('workflow-details-description');
  });

  it('updates description on blur when the value changed', async () => {
    const update = vi.fn().mockResolvedValue({});
    const refresh = vi.fn();

    render(
      <WorkflowDetailsModal record={record} open onClose={() => undefined} resource={{ update }} refresh={refresh} />,
    );

    const textarea = screen.getByRole('textbox', { name: 'Description' });
    fireEvent.change(textarea, { target: { value: '456' } });
    fireEvent.blur(textarea, { target: { value: '456' } });

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith({
        filterByTk: 11,
        values: {
          description: '456',
        },
      });
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('does not update when blur keeps the original description', async () => {
    const update = vi.fn();

    render(
      <WorkflowDetailsModal
        record={record}
        open
        onClose={() => undefined}
        resource={{ update }}
        refresh={() => undefined}
      />,
    );

    const textarea = screen.getByRole('textbox', { name: 'Description' });
    fireEvent.blur(textarea, { target: { value: '123' } });

    await waitFor(() => {
      expect(update).not.toHaveBeenCalled();
    });
  });
});
