import React from 'react';
import { render, screen, sleep } from 'testUtils';
import App1 from '../demos/demo1';

describe('Page', () => {
  it('should render correctly', async () => {
    render(<App1 />);

    // 等待 document.title 更新
    await sleep(100);

    expect(screen.getByText(/page title/i)).toBeInTheDocument();
    expect(screen.getByText(/page content/i)).toBeInTheDocument();
    expect(document.title).toBe('Page Title - NocoBase');
  });
});
