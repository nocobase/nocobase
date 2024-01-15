import { render, screen, waitFor } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';

describe('Page', () => {
  it('should render correctly', async () => {
    render(<App1 />);

    await waitFor(() => {
      expect(screen.getByText(/page title/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/page content/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.title).toBe('Page Title - NocoBase');
    });
  });
});
