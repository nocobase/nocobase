import React from 'react';
import { render, screen, waitFor } from 'testUtils';
import AppContextProvider from '../../../../test/AppContextProvider';
import App1 from '../demos/demo1';

describe('Page', () => {
  it('should render correctly', async () => {
    render(<App1 />, {
      wrapper: AppContextProvider,
    });

    await waitFor(() => {
      expect(screen.getByText(/page title/i)).toBeInTheDocument();
      expect(screen.getByText(/page content/i)).toBeInTheDocument();
      expect(document.title).toBe('Page Title - NocoBase');
    });
  });
});
