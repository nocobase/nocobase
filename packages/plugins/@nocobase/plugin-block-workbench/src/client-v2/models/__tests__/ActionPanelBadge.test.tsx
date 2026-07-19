/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, screen } from '@testing-library/react';
import { ActionModel } from '@nocobase/client-v2';
import { FlowEngine, observable } from '@nocobase/flow-engine';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ActionPanelBadge,
  ActionPanelBlockModel,
  WorkbenchLayout,
  type ActionPanelBadgeOptions,
} from '../ActionPanelBlockModel';

class TestBadgeActionModel extends ActionModel {
  private readonly actionPanelBadgeState = observable<{ value: ActionPanelBadgeOptions | null }>({
    value: null,
  });

  get actionPanelBadge() {
    return this.actionPanelBadgeState.value;
  }

  set actionPanelBadge(value: ActionPanelBadgeOptions | null) {
    this.actionPanelBadgeState.value = value;
  }
}

function setupMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function createThemeToken() {
  return {
    colorBgContainer: '#fff',
    colorBgTextHover: '#f5f5f5',
    colorBorderSecondary: '#f0f0f0',
    colorPrimary: '#1677ff',
    colorText: '#000',
    controlHeightLG: 40,
    fontSize: 14,
    lineHeight: 1.5715,
    marginXS: 8,
    marginSM: 12,
    motionDurationMid: '0.2s',
    opacityLoading: 0.45,
    padding: 16,
    paddingSM: 8,
    borderRadiusLG: 8,
  };
}

function createActionPanelWithBadgeAction() {
  const engine = new FlowEngine();
  engine.registerModels({ ActionPanelBlockModel, TestBadgeActionModel });
  engine.context.defineProperty('themeToken', {
    value: createThemeToken(),
  });
  engine.context.defineProperty('isMobileLayout', {
    value: false,
  });

  const block = engine.createModel<ActionPanelBlockModel>({
    uid: 'action-panel',
    use: 'ActionPanelBlockModel',
    props: {
      layout: WorkbenchLayout.Grid,
    },
    subModels: {
      actions: [
        {
          uid: 'todo-action',
          use: 'TestBadgeActionModel',
          props: {
            color: '#1677ff',
            icon: 'CheckCircleOutlined',
            title: 'Workflow todos',
          },
        },
      ],
    },
  });
  const actions = block.subModels.actions as TestBadgeActionModel[];

  return {
    action: actions[0],
    block,
  };
}

describe('ActionPanelBadge', () => {
  beforeEach(() => {
    setupMatchMedia();
  });

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

  it('updates the rendered action badge when the action badge field changes after mount', async () => {
    const { action, block } = createActionPanelWithBadgeAction();
    render(block.renderComponent() as React.ReactElement);

    expect(await screen.findByText('Workflow todos')).toBeInTheDocument();
    expect(screen.queryByTitle('12')).not.toBeInTheDocument();

    await act(async () => {
      action.actionPanelBadge = { count: 12, overflowCount: 99 };
    });

    expect(await screen.findByTitle('12')).toBeInTheDocument();
  });
});
