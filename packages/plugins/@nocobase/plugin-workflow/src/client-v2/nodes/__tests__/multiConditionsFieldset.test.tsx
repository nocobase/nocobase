/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { MultiConditionsFieldset } from '../components/multi-conditions';

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => key,
}));

describe('MultiConditionsFieldset', () => {
  it('renders the continueOnNoMatch options with the v1-aligned labels', () => {
    render(
      <Form initialValues={{ config: { continueOnNoMatch: false } }}>
        <MultiConditionsFieldset />
      </Form>,
    );

    expect(screen.getByText('When no condition matches')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'End as failed' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Continue the workflow' })).toBeInTheDocument();
  });
});
