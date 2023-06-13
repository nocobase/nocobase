import { render, screen } from '@testing-library/react';
import { ChartConfigure } from '../block';
import React from 'react';
import { Grid } from '@nocobase/client';
import { vi } from 'vitest';
import * as client from '@nocobase/client';

describe('ChartConfigure', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render correctly', () => {
    vi.spyOn(client, 'useDesignable').mockReturnValue({} as any);
    render(<ChartConfigure insert={(schema, options) => {}} />);
    const modal = document.querySelector('.ant-modal-content') as HTMLInputElement;
    expect(modal).toBeInTheDocument();
  });
});
