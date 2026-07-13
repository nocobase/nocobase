/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../../../../../flowEngine';
import { FlowModel } from '../../../../../models/flowModel';
import { openRequiredParamsStepFormDialog } from '../StepRequiredSettingsDialog';

vi.mock('@formily/react', () => ({
  createSchemaField: () => () => null,
  FormConsumer: ({ children }: { children: () => React.ReactNode }) => <>{children()}</>,
}));

vi.mock('@formily/antd-v5', () => ({
  FormDialog: (_options: unknown, renderContent: (form: Record<string, unknown>) => React.ReactNode) => {
    const dialog = {
      close: vi.fn(),
      open({ initialValues }: { initialValues: Record<string, unknown> }) {
        const form = {
          values: initialValues,
          submit: vi.fn().mockResolvedValue(undefined),
          validate: vi.fn().mockResolvedValue(undefined),
        };
        render(<>{renderContent(form)}</>);
      },
    };
    return dialog;
  },
  FormStep: {
    createFormStep: () => ({ current: 0, allowBack: false, allowNext: false, next: vi.fn(), back: vi.fn() }),
  },
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    message: { error: vi.fn() },
  };
});

describe('StepRequiredSettingsDialog runtime steps', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('finds and saves a required runtime-only step with hooks', async () => {
    const beforeParamsSave = vi.fn((ctx, params) => {
      ctx.model.setStepParams('settings', 'canonical', params);
    });
    const afterParamsSave = vi.fn();
    class RequiredRuntimeModel extends FlowModel {
      getRuntimeFlowSettingSteps(flowKey: string) {
        if (flowKey !== 'settings') return undefined;
        return {
          requiredRuntime: {
            title: 'Required runtime',
            paramsRequired: true,
            persistParams: false,
            defaultParams: { value: 'runtime value' },
            uiSchema: { value: { type: 'string', required: true, 'x-component': 'Input' } },
            beforeParamsSave,
            afterParamsSave,
          },
        };
      }
    }

    const engine = new FlowEngine();
    RequiredRuntimeModel.registerFlow({ key: 'settings', steps: {} });
    const model = new RequiredRuntimeModel({ uid: 'required-runtime', flowEngine: engine });
    vi.spyOn(model, 'saveStepParams').mockResolvedValue(undefined);

    const completed = openRequiredParamsStepFormDialog({ model });
    const completeButton = await screen.findByRole('button', { name: 'Complete configuration' });
    fireEvent.click(completeButton);
    await completed;

    expect(beforeParamsSave).toHaveBeenCalledOnce();
    expect(afterParamsSave).toHaveBeenCalledOnce();
    expect(model.getStepParams('settings', 'requiredRuntime')).toBeUndefined();
    expect(model.getStepParams('settings', 'canonical')).toEqual({ value: 'runtime value' });
    expect(model.saveStepParams).toHaveBeenCalledOnce();
  });
});
