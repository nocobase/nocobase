import React from 'react';
import { render, screen } from 'testUtils';
import App1 from '../demos/demo1';

describe('CardItem', () => {
  it('should works', () => {
    render(<App1 />);

    // 标题
    expect(screen.getByText('Card')).toBeInTheDocument();
    // 内容
    expect(screen.getByText('Hello Card!')).toBeInTheDocument();
  });
});
