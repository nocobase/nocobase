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
import { WorkflowTasksEmbeddedPageModel } from '../WorkflowTasksEmbeddedPageModel';

vi.mock('../../pages/WorkflowTasksPage', async () => {
  const ReactModule = await import('react');
  return {
    WorkflowTasksContent: ({ forceMobile }: { forceMobile?: boolean }) =>
      ReactModule.createElement('div', {
        'data-force-mobile': String(forceMobile),
        'data-testid': 'workflow-tasks-content',
      }),
    WorkflowTasksEmbeddedRouteProvider: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement('div', { 'data-testid': 'workflow-tasks-route-provider' }, children),
  };
});

describe('WorkflowTasksEmbeddedPageModel', () => {
  it('disables flow settings toolbar from page model props', () => {
    const model = Object.create(WorkflowTasksEmbeddedPageModel.prototype) as WorkflowTasksEmbeddedPageModel & {
      setProps: ReturnType<typeof vi.fn>;
    };
    model.setProps = vi.fn();

    model.onInit({});

    expect(model.setProps).toHaveBeenCalledWith('showFlowSettings', false);
  });

  it('renders workflow tasks content directly instead of the default child page tabs', () => {
    const model = Object.create(WorkflowTasksEmbeddedPageModel.prototype) as WorkflowTasksEmbeddedPageModel & {
      renderTabs: ReturnType<typeof vi.fn>;
    };
    model.props = {
      enableTabs: true,
    } as WorkflowTasksEmbeddedPageModel['props'];
    model.renderTabs = vi.fn(() => <div data-testid="default-child-tabs" />);

    render(model.render() as React.ReactElement);

    expect(screen.getByTestId('workflow-tasks-route-provider')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-tasks-content')).toHaveAttribute('data-force-mobile', 'true');
    expect(screen.queryByTestId('default-child-tabs')).not.toBeInTheDocument();
  });
});
