import React from 'react';
import { render } from 'testUtils';
import App1 from '../demos/demo1';

describe('GridCard', () => {
  it('should render correctly', () => {
    render(<App1 />);
  });
});
