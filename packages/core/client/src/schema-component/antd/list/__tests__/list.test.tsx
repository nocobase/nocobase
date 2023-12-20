import { render } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';

describe('List', () => {
  it('should render correctly', () => {
    render(<App1 />);
  });
});
