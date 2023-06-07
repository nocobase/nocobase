import React from 'react';
import { render, sleep } from 'testUtils';
import App1 from '../demos/demo1';

// jsdom does not support canvas, so we need to skip this test
describe.skip('G2Plot', () => {
  it('basic', async () => {
    render(<App1 />);

    await sleep(100);

    const g2plot = document.querySelector('.g2plot') as HTMLDivElement;
    expect(g2plot).toBeInTheDocument();
  });
});
