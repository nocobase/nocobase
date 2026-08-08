/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChartOptionsPanel } from '../ChartOptionsPanel';
import { EventsPanel } from '../EventsPanel';

const mocks = vi.hoisted(() => ({
  ctx: null as Record<string, unknown> | null,
}));

vi.mock('@nocobase/client-v2', () => ({
  RunJSEditorField: (props: {
    scene: string;
    sourceLocator: unknown;
    sourceLabel?: string;
    surfaceStyle: string;
    onChange?: (value: { code: string; version: string }) => void;
    onPreview?: (value: { code: string; version: string }) => void | Promise<void>;
  }) => (
    <div>
      <button
        type="button"
        data-locator={JSON.stringify(props.sourceLocator)}
        data-surface-style={props.surfaceStyle}
        onClick={() => props.onChange?.({ code: `${props.scene}:published`, version: 'v2' })}
      >
        {props.sourceLabel}
      </button>
      <button
        type="button"
        aria-label={`${props.scene}:preview`}
        onClick={() => props.onPreview?.({ code: `${props.scene}:preview`, version: 'v2' })}
      />
    </div>
  ),
}));

vi.mock('@nocobase/flow-engine', () => ({
  observer: (Component: React.ComponentType) => Component,
  useFlowSettingsContext: () => mocks.ctx,
}));

vi.mock('../ChartOptionsBuilder', () => ({
  ChartOptionsBuilder: () => <div>builder</div>,
}));

vi.mock('../QueryBuilder.service', () => ({
  getFieldOptions: () => [],
}));

vi.mock('../../utils', () => ({
  useCompile: () => (value: unknown) => value,
}));

describe('chart RunJS Studio surfaces', () => {
  afterEach(() => {
    mocks.ctx = null;
    localStorage.clear();
  });

  it('passes chart.option locator metadata and previews without mutating settings form values', async () => {
    const formValues = {
      chart: {
        option: {
          mode: 'custom',
          raw: 'return oldOption;',
        },
      },
      query: {},
    };
    const onPreview = vi.fn();
    mocks.ctx = {
      auth: {
        user: {
          id: 'user-1',
        },
      },
      model: {
        uid: 'chart-model-1',
        context: {},
        onPreview,
      },
      getStepFormValues: () => formValues,
    };

    render(<ChartOptionsPanel />);

    const editorButton = screen.getByRole('button', { name: 'Chart option' });
    expect(editorButton).toHaveAttribute(
      'data-locator',
      JSON.stringify({
        kind: 'chart.option',
        modelUid: 'chart-model-1',
      }),
    );
    expect(editorButton).toHaveAttribute('data-surface-style', 'value');

    fireEvent.click(screen.getByLabelText('chart.option:preview'));

    await waitFor(() => {
      expect(onPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          chart: {
            option: {
              mode: 'custom',
              raw: 'chart.option:preview',
            },
          },
        }),
      );
    });
    expect(formValues.chart.option.raw).toBe('return oldOption;');
  });

  it('passes chart.events locator metadata and previews without mutating settings form values', async () => {
    const formValues = {
      chart: {
        events: {
          mode: 'custom',
          raw: 'chart.on("click", handler);',
        },
      },
    };
    const onPreview = vi.fn();
    mocks.ctx = {
      model: {
        uid: 'chart-model-2',
        onPreview,
      },
      getStepFormValues: () => formValues,
    };

    render(<EventsPanel />);

    const editorButton = screen.getByRole('button', { name: 'Chart events' });
    expect(editorButton).toHaveAttribute(
      'data-locator',
      JSON.stringify({
        kind: 'chart.events',
        modelUid: 'chart-model-2',
      }),
    );
    expect(editorButton).toHaveAttribute('data-surface-style', 'action');

    fireEvent.click(screen.getByLabelText('chart.events:preview'));

    await waitFor(() => {
      expect(onPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          chart: {
            events: {
              mode: 'custom',
              raw: 'chart.events:preview',
            },
          },
        }),
      );
    });
    expect(formValues.chart.events.raw).toBe('chart.on("click", handler);');
  });
});
