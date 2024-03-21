import { render } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';

describe('TableV2', () => {
  it('basic', async () => {
    render(<App1 />);
  });

  it('tree table', () => {
    render(<App2 />);
  });
});
