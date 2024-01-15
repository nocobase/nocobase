import { fireEvent, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';

describe('Cascader', () => {
  it('sync', async () => {
    const { container } = render(<App1 />);
    const select = container.querySelector('.ant-select-selector') as HTMLElement;
    // 显示下拉框
    await userEvent.click(select);

    // 点击选项
    fireEvent.click(screen.getByText('Zhejiang'));
    fireEvent.click(screen.getByText('Hangzhou'));
    fireEvent.click(screen.getByText('West Lake'));

    // 页面中显示的内容
    // 因为内容被不同的标签分开了，所以需要分开查找
    expect(screen.getByText('Zhejiang /')).toBeInTheDocument();
    expect(screen.getByText('Hangzhou /')).toBeInTheDocument();
  });

  it('async', async () => {
    const { container } = render(<App2 />);
    const select = container.querySelector('.ant-select-selector') as HTMLElement;

    // 显示下拉框
    await userEvent.click(select);

    // 点击选项
    fireEvent.click(screen.getByText('Zhejiang'));

    // 因为是异步加载，所以需要等待一下
    expect(screen.queryByText('Zhejiang Dynamic 1')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Zhejiang Dynamic 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Zhejiang Dynamic 1'));

    // 页面中显示的内容
    // 因为内容被不同的标签分开了，所以需要分开查找
    expect(screen.getByText('Zhejiang /')).toBeInTheDocument();
  });
});
