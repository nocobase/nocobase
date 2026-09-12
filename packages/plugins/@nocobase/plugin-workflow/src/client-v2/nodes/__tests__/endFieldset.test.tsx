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
import { EndFieldset } from '../components/end';

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => key,
}));

describe('EndFieldset', () => {
  it('renders the v1-aligned end status options and default value', () => {
    render(
      <Form>
        <EndFieldset />
      </Form>,
    );

    expect(screen.getByText('End status')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Succeeded' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Failed' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Succeeded' })).toBeChecked();
  });
});
