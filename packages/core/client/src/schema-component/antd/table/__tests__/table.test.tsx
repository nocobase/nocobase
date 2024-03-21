import { render } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';
import App3 from '../demos/demo3';
import App4 from '../demos/demo4';

describe('Table', () => {
  it('Table.Array', () => {
    const { container } = render(<App1 />);
  });

  it('Table.Void', () => {
    const { container } = render(<App2 />);
  });

  it('Table.RowSelection', () => {
    const { container } = render(<App3 />);
  });

  it('With Actions', () => {
    const { container } = render(<App4 />);
  });
});
