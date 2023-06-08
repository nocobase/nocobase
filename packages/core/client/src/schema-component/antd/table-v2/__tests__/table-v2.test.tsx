import React from 'react';
import { render, sleep } from 'testUtils';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';

describe('TableV2', () => {
  it('basic', async () => {
    const { container } = render(<App1 />);

    await sleep(300);
    expect(container).toMatchSnapshot();
  });

  it('tree table', () => {
    const { container } = render(<App2 />);
    expect(container).toMatchSnapshot();
  });
});
