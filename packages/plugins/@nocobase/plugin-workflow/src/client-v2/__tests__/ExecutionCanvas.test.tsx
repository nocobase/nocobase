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

vi.mock('@nocobase/client-v2', () => ({
  useApp: () => ({
    getHref: (path: string) => `/v${path}`,
    pluginSettingsManager: { getRoutePath: () => '/admin/settings/workflow' },
  }),
}));

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
  it('links to the workflow list when the execution workflow does not exist', () => {
    render(<ExecutionCanvas record={{ id: 1, jobs: [] }} resource={{}} refresh={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'Back to Workflow List' })).toHaveAttribute(
      'href',
      '/v/admin/settings/workflow',
    );
  });
});
