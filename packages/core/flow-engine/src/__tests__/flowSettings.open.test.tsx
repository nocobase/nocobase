/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { FlowSettings } from '../flowSettings';
import { FlowModel } from '../models';
import { FlowEngine } from '../flowEngine';

// Mock the openStepSettings entry to simulate rendering a dialog without bringing full UI deps
vi.mock('../components', () => {
  return {
    openStepSettings: vi.fn().mockImplementation(({ flowKey, stepKey }) => {
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'step-settings-dialog');
      container.textContent = `Mock StepSettingsDialog: ${flowKey}.${stepKey}`;
      document.body.appendChild(container);
      return Promise.resolve({ rendered: true });
    }),
  };
});

describe('FlowSettings.open (single step dialog)', () => {
  afterEach(() => {
    // cleanup mock dialog
    document.querySelectorAll('[data-testid="step-settings-dialog"]').forEach((el) => el.remove());
    vi.clearAllMocks();
  });

  it('should open a single step dialog and render without errors', async () => {
    const { openStepSettings } = await import('../components');
    const flowSettings = new FlowSettings();

    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-1', flowEngine: engine });

    const options = {
      model,
      flowKey: 'testFlow',
      stepKey: 'general',
    } as const;

    const result = await flowSettings.open(options as any);

    // verify mocked opener called with expected args
    expect(openStepSettings).toHaveBeenCalledTimes(1);
    expect(openStepSettings).toHaveBeenCalledWith(options);

    // dialog stub is rendered
    const dialog = screen.getByTestId('step-settings-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.textContent).toContain('testFlow.general');

    // return value piped through
    expect(result).toEqual({ rendered: true });
  });
});
