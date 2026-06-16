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
import { describe, expect, it } from 'vitest';
import { DisplayDateTimeFieldModel } from '../DisplayDateTimeFieldModel';

describe('DisplayDateTimeFieldModel', () => {
  it('uses dateFormat, showTime, and timeFormat when rendering read pretty datetime text', () => {
    const engine = new FlowEngine();
    engine.registerModels({ DisplayDateTimeFieldModel });

    const model = engine.createModel<DisplayDateTimeFieldModel>({
      use: DisplayDateTimeFieldModel,
      uid: 'display-datetime-field-format',
      props: {
        value: '2026-06-15 13:05:06',
        dateFormat: 'YYYY-MM-DD',
        showTime: true,
        timeFormat: 'HH:mm:ss',
      },
    });

    render(model.render());

    expect(screen.getByText('2026-06-15 13:05:06')).toBeInTheDocument();
  });

  it('does not reuse a time-only format when rendering datetime text', () => {
    const engine = new FlowEngine();
    engine.registerModels({ DisplayDateTimeFieldModel });

    const model = engine.createModel<DisplayDateTimeFieldModel>({
      use: DisplayDateTimeFieldModel,
      uid: 'display-datetime-field-stale-time-format',
      props: {
        value: '2026-06-15 13:05:06',
        format: 'HH:mm:ss',
        showTime: true,
        timeFormat: 'HH:mm:ss',
      },
    });

    render(model.render());

    expect(screen.getByText('2026-06-15 13:05:06')).toBeInTheDocument();
    expect(screen.queryByText('13:05:06')).not.toBeInTheDocument();
  });

  it('keeps an existing complete datetime format when no split format props are configured', () => {
    const engine = new FlowEngine();
    engine.registerModels({ DisplayDateTimeFieldModel });

    const model = engine.createModel<DisplayDateTimeFieldModel>({
      use: DisplayDateTimeFieldModel,
      uid: 'display-datetime-field-complete-format',
      props: {
        value: '2026-06-15 13:05:06',
        format: 'YYYY/MM/DD HH:mm:ss',
      },
    });

    render(model.render());

    expect(screen.getByText('2026/06/15 13:05:06')).toBeInTheDocument();
  });

  it('renders only the date for date-only fields even when a datetime format remains', () => {
    const engine = new FlowEngine();
    engine.registerModels({ DisplayDateTimeFieldModel });

    const model = engine.createModel<DisplayDateTimeFieldModel>({
      use: DisplayDateTimeFieldModel,
      uid: 'display-datetime-field-date-only',
      props: {
        value: '2026-06-15 13:05:06',
        dateOnly: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        showTime: false,
        timeFormat: 'HH:mm:ss',
      },
    });

    render(model.render());

    expect(screen.getByText('2026-06-15')).toBeInTheDocument();
    expect(screen.queryByText('2026-06-15 13:05:06')).not.toBeInTheDocument();
  });
});
