import React from 'react';
import { render, screen, sleep } from 'testUtils';
import App1 from '../demos/demo1';

describe('Kanban', () => {
  it('should render correctly', async () => {
    render(<App1 />);

    await sleep(300);

    // 每列卡片的状态
    expect(screen.getByText(/未开始/i)).toBeInTheDocument();
    expect(screen.getByText(/进行中/i)).toBeInTheDocument();
    expect(screen.getByText(/测试中/i)).toBeInTheDocument();
    expect(screen.getByText(/已完成/i)).toBeInTheDocument();

    // 第一个卡片的内容
    expect(screen.getByText(/子表格字段缺少标题/i)).toBeInTheDocument();
    expect(screen.getByText(/见附件，在此位置显示标题，包括表单和详情/i)).toBeInTheDocument();

    // 最后一个卡片的内容
    expect(screen.getByText(/新增 uischema:clearancestor action api/i)).toBeInTheDocument();
  });
});
