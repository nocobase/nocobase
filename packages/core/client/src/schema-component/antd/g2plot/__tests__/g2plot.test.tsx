import { render, waitFor } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';

// jsdom does not support canvas, so we need to skip this test
describe.skip('G2Plot', () => {
  it('basic', async () => {
    render(<App1 />);

    await waitFor(() => {
      const g2plot = document.querySelector('.g2plot') as HTMLDivElement;
      expect(g2plot).toBeInTheDocument();
    });
  });
});
