import { render, screen, userEvent, waitFor, within } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';

describe.skip('RecordPicker', () => {
  it('should show selected options', async () => {
    render(<App1 />);

    let selector;
    await waitFor(() => {
      selector = document.querySelector('.ant-select-selector') as HTMLElement;
      expect(selector).toBeInTheDocument();
    });

    await userEvent.click(selector);
    await waitFor(() => {
      // 弹窗标题
      expect(screen.queryByText(/select record/i)).toBeInTheDocument();
    });

    const checkboxes = document.querySelectorAll('.ant-checkbox');

    // 第 3 个选项的内容是： “软件开发”
    await userEvent.click(checkboxes[2]);
    await userEvent.click(screen.getByText(/submit/i));

    await waitFor(() => {
      expect(within(selector).queryByText(/软件开发/i)).toBeInTheDocument();
      expect(screen.queryByText(/软件开发/i, { selector: '.test-record-picker-read-pretty-item' })).toBeInTheDocument();
    });
  });
});
