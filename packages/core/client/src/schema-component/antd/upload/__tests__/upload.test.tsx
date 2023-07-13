import React from 'react';
import { render } from 'testUtils';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';

describe('Upload', () => {
  it('basic', () => {
    render(<App1 />);
  });

  it('uploading', () => {
    render(<App2 />);
  });
});
