import React from 'react';
import { render } from 'testUtils';
import App1 from '../demos/demo1';

describe('gantt', () => {
  it('renders without crashing', () => {
    render(<App1 />);
  });
});
