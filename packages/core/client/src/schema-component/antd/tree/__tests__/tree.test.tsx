import React from 'react';
import { render } from 'testUtils';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';

describe('basic tree render', () => {
  it('basic', async () => {
    render(<App1 />);

  });
  it('async tree', () => {5
    render(<App2 />);
  });
});
