import React from 'react';
import { render, screen, sleep, userEvent, within } from 'testUtils';
import App1 from '../demos/demo1';

describe('RecordPicker', () => {
  it('should show selected options', async () => {
    render(<App1 />);

    const selector = document.querySelector('.ant-select-selector') as HTMLElement;
    expect(selector).toBeInTheDocument();

    await userEvent.click(selector);
    await sleep(100);

    // 弹窗标题
    expect(screen.getByText(/select record/i)).toBeInTheDocument();
    const checkboxes = document.querySelectorAll('.ant-checkbox');

    // 第 3 个选项的内容是： “软件开发”
    await userEvent.click(checkboxes[2]);
    await userEvent.click(screen.getByText(/submit/i));

    expect(within(selector).getByText(/软件开发/i)).toBeInTheDocument();
    expect(screen.getByText(/软件开发/i, { selector: '.test-record-picker-read-pretty-item' })).toBeInTheDocument();
  });
});
