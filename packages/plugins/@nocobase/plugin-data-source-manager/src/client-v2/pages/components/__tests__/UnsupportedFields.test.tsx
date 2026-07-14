/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UnsupportedFields } from '../UnsupportedFields';

vi.mock('../../../locale', () => ({
  useT: () => (key: string) => key,
}));

describe('UnsupportedFields', () => {
  it('renders unsupported field names and database raw types', () => {
    render(<UnsupportedFields dataSource={[{ name: 'point', rawType: 'POINT' }]} />);

    expect(screen.getByText('Unknown field type')).toBeInTheDocument();
    expect(screen.getByText('Field name')).toBeInTheDocument();
    expect(screen.getByText('Field database type')).toBeInTheDocument();
    expect(screen.getByText('point')).toBeInTheDocument();
    expect(screen.getByText('POINT')).toBeInTheDocument();
  });
});
