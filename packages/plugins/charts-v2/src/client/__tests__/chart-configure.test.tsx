import * as client from '@nocobase/client';
import { render } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import { ChartConfigure } from '../block';

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
