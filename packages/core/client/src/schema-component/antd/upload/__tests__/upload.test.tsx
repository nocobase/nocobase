import React from 'react';
import { render } from 'testUtils';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';

describe('Upload', () => {
  it('basic', () => {
    const { container } = render(<App1 />);
    expect(container).toMatchSnapshot();
  });

  it('uploading', () => {
    const { container } = render(<App2 />);
    expect(container).toMatchSnapshot();
  });
});
