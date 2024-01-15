import { render, screen, userEvent } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';

describe.skip('CollectionSelect', () => {
  it('should works', async () => {
    render(<App1 />);

    // 标题
    expect(screen.getByText('Collection')).toBeInTheDocument();

    const selector = document.querySelector('.ant-select-selector');
    expect(selector).toBeInTheDocument();

    await userEvent.click(selector);

    // 下拉框内容
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('测试表')).toBeInTheDocument();
  });
});
