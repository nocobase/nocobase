/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModelProvider } from '@nocobase/flow-engine';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import React from 'react';
import { DisplayTimeFieldModel } from '../DisplayTimeFieldModel';
import { TimeFieldModel } from '../TimeFieldModel';

describe('TimeFieldModel', () => {
  it('uses timeFormat before format when rendering the editable time picker', () => {
    const engine = new FlowEngine();
    engine.registerModels({ TimeFieldModel });

    const model = engine.createModel<TimeFieldModel>({
      use: TimeFieldModel,
      uid: 'time-field-format',
      props: {
        value: '13:05:06',
        format: 'HH:mm:ss',
        timeFormat: 'hh:mm:ss a',
      },
    });

    render(
      <FlowModelProvider model={model}>
        <>{model.render()}</>
      </FlowModelProvider>,
    );

    expect(screen.getByDisplayValue('01:05:06 pm')).toBeInTheDocument();
  });
});

describe('DisplayTimeFieldModel', () => {
  it('uses timeFormat before format when rendering read pretty time text', () => {
    const engine = new FlowEngine();
    engine.registerModels({ DisplayTimeFieldModel });

    const model = engine.createModel<DisplayTimeFieldModel>({
      use: DisplayTimeFieldModel,
      uid: 'display-time-field-format',
      props: {
        value: '13:05:06',
        format: 'HH:mm:ss',
        timeFormat: 'hh:mm:ss a',
      },
    });

    render(model.render());

    expect(screen.getByText('01:05:06 pm')).toBeInTheDocument();
  });
});
