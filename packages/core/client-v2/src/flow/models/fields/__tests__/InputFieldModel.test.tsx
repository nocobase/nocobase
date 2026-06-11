/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { InputFieldModel } from '../InputFieldModel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function createInputFieldModel(props?: Record<string, unknown>) {
  const engine = new FlowEngine();
  return new InputFieldModel({
    uid: 'input-field-model-test',
    flowEngine: engine,
    props,
  });
}

describe('InputFieldModel', () => {
  it('renders the normal input when scan input is disabled', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const model = createInputFieldModel({ disableManualInput: true, enableScan: false });

    render(<>{model.render()}</>);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scan to input' })).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining('React does not recognize the `disableManualInput` prop'),
      expect.anything(),
    );

    consoleError.mockRestore();
  });

  it('renders ScanInput when scan input is enabled', () => {
    const model = createInputFieldModel({ enableScan: true });

    render(<>{model.render()}</>);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scan to input' })).toBeInTheDocument();
  });

  it('stores enableScan and clears disableManualInput when scan input is turned off', () => {
    const model = createInputFieldModel();
    const step = model.getFlow('scanInputSettings')?.steps.enableScan;
    const setProps = vi.fn();

    step?.handler(
      {
        model: {
          props: { disableManualInput: true },
          setProps,
        },
      },
      { enableScan: false },
    );

    expect(setProps).toHaveBeenCalledWith({
      enableScan: false,
      disableManualInput: false,
    });
  });

  it('does not restore manual input disabling after scan input is turned off', () => {
    const model = createInputFieldModel({ enableScan: true, disableManualInput: true });
    const flow = model.getFlow('scanInputSettings');
    const ctx = { model };

    flow?.steps.enableScan.handler(ctx, { enableScan: false });
    flow?.steps.disableManualInput.handler(ctx, { disableManualInput: true });

    expect(model.props).toMatchObject({
      enableScan: false,
      disableManualInput: false,
    });
  });

  it('hides disableManualInput until scan input is enabled', () => {
    const model = createInputFieldModel();
    const step = model.getFlow('scanInputSettings')?.steps.disableManualInput;

    const hidden = step?.hideInSettings({
      model: {
        props: { enableScan: false },
        getProps: () => ({}),
      },
    });

    expect(hidden).toBe(true);
  });

  it('updates disableManualInput visibility from the current enableScan setting params', () => {
    const model = createInputFieldModel({ enableScan: false });
    const step = model.getFlow('scanInputSettings')?.steps.disableManualInput;

    model.setStepParams('scanInputSettings', 'enableScan', { enableScan: true });

    expect(step?.hideInSettings({ model })).toBe(false);

    model.setStepParams('scanInputSettings', 'enableScan', { enableScan: false });

    expect(step?.hideInSettings({ model })).toBe(true);
  });
});
