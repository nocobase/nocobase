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
    const model = createInputFieldModel();

    render(<>{model.render()}</>);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scan to input' })).not.toBeInTheDocument();
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
});
