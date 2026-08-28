/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ParallelFieldset } from '../nodes/components/parallel';

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  RadioWithTooltip: (props: { options?: Array<{ value: string; label: string; tooltip: string }> }) => (
    <div data-testid="radio-with-tooltip" data-options={JSON.stringify(props.options ?? [])} />
  ),
}));

function renderWithForm(initialValues?: Record<string, unknown>) {
  let formRef: ReturnType<typeof Form.useForm>[0] | undefined;

  function Wrapper() {
    const [form] = Form.useForm();
    formRef = form;

    return (
      <Form form={form} initialValues={initialValues}>
        <ParallelFieldset />
      </Form>
    );
  }

  render(<Wrapper />);
  return () => formRef;
}

describe('ParallelFieldset', () => {
  it('uses all as the default mode and exposes the v1 mode options', async () => {
    const getForm = renderWithForm();

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'mode'])).toBe('all');
    });

    expect(screen.getByTestId('radio-with-tooltip')).toHaveAttribute(
      'data-options',
      JSON.stringify([
        { value: 'all', label: 'All succeeded', tooltip: 'Continue after all branches succeeded' },
        { value: 'any', label: 'Any succeeded', tooltip: 'Continue after any branch succeeded' },
        {
          value: 'race',
          label: 'Any succeeded or failed',
          tooltip: 'Continue after any branch succeeded, or exit after any branch failed.',
        },
        {
          value: 'allSettled',
          label: 'Run all branches (ignore failures)',
          tooltip: 'Always continue after all branches end, regardless of success or failure.',
        },
      ]),
    );
  });
});
