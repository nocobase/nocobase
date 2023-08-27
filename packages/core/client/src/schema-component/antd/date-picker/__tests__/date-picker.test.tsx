import React from 'react';
import { render, screen, sleep, userEvent, waitFor } from 'testUtils';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';
import App3 from '../demos/demo3';
import App4 from '../demos/demo4';
import App5 from '../demos/demo5';
import App6 from '../demos/demo6';
import App7 from '../demos/demo7';
import App8 from '../demos/demo8';
import App9 from '../demos/demo9';

describe('DatePicker', () => {
  it('basic', async () => {
    const { container, getByText } = render(<App1 />);

    await sleep();

    const picker = container.querySelector('.ant-picker') as HTMLElement;
    const input = container.querySelector('input') as HTMLElement;

    await userEvent.click(picker);
    await userEvent.type(input, '2023/05/01 00:00:00');
    await userEvent.click(getByText('OK'));

    await waitFor(() => {
      expect(input).toHaveValue('2023/05/01 00:00:00');
      // Read pretty
      expect(screen.getByText('2023/05/01 00:00:00', { selector: '.ant-description-date-picker' })).toBeInTheDocument();

      // TODO: 需要有个方法来固定测试环境的时区
      if (!process.env.GITHUB_ACTIONS) {
        // Value
        expect(screen.getByText('2023-04-30T16:00:00.000Z')).toBeInTheDocument();
      }
    });
  });

  it('GMT', async () => {
    const { container, getByText } = render(<App2 />);

    await sleep();

    const picker = container.querySelector('.ant-picker') as HTMLElement;
    const input = container.querySelector('input') as HTMLElement;

    await userEvent.click(picker);
    // 清空默认值
    await userEvent.clear(input);
    await userEvent.type(input, '2023/05/01 00:00:00');
    await userEvent.click(getByText('OK'));

    expect(input).toHaveValue('2023/05/01 00:00:00');
    // Read pretty
    expect(screen.getByText('2023/05/01 00:00:00', { selector: '.ant-description-date-picker' })).toBeInTheDocument();
    // Value
    expect(screen.getByText('2023-05-01T00:00:00.000Z')).toBeInTheDocument();
  });

  it('non-UTC', async () => {
    const { container } = render(<App3 />);

    await sleep();

    const picker = container.querySelector('.ant-picker') as HTMLElement;
    const input = container.querySelector('input') as HTMLElement;

    await userEvent.click(picker);
    await userEvent.type(input, '2023/05/01');

    const selected = document.querySelector('.ant-picker-cell-selected') as HTMLElement;
    expect(selected).toBeInTheDocument();
    await userEvent.click(selected);

    expect(input).toHaveValue('2023/05/01');
    // Read pretty
    expect(screen.getByText('2023/05/01 00:00:00', { selector: '.ant-description-date-picker' })).toBeInTheDocument();
    // Value
    expect(screen.getByText('2023-05-01')).toBeInTheDocument();
  });
});

describe('RangePicker', () => {
  it('GMT', async () => {
    const { container, getByPlaceholderText } = render(<App4 />);

    await sleep();

    const picker = container.querySelector('.ant-picker') as HTMLElement;
    const startInput = getByPlaceholderText('Start date');
    const endInput = getByPlaceholderText('End date');

    await userEvent.click(picker);
    await userEvent.click(document.querySelector('[title="2023-05-01"]') as HTMLElement);
    await userEvent.click(document.querySelector('[title="2023-05-02"]') as HTMLElement);

    await waitFor(() => expect(startInput).toHaveValue('2023-05-01'));
    await waitFor(() => expect(endInput).toHaveValue('2023-05-02'));
    // Read pretty
    expect(screen.getByText('2023-05-01~2023-05-02', { selector: '.ant-description-text' })).toBeInTheDocument();
    // Value
    expect(screen.getByText('2023-05-01T00:00:00.000Z ~ 2023-05-02T23:59:59.999Z')).toBeInTheDocument();
  });

  it('non-GMT', async () => {
    const { container, getByPlaceholderText } = render(<App5 />);

    await sleep();

    const picker = container.querySelector('.ant-picker') as HTMLElement;
    const startInput = getByPlaceholderText('Start date');
    const endInput = getByPlaceholderText('End date');

    await userEvent.click(picker);
    await userEvent.click(document.querySelector('[title="2023-05-01"]') as HTMLElement);
    await userEvent.click(document.querySelector('[title="2023-05-02"]') as HTMLElement);

    await waitFor(() => {
      expect(startInput).toHaveValue('2023-05-01');
      expect(endInput).toHaveValue('2023-05-02');
      // Read pretty
      expect(screen.getByText('2023-05-01~2023-05-02', { selector: '.ant-description-text' })).toBeInTheDocument();

      if (!process.env.GITHUB_ACTIONS) {
        // Value
        expect(screen.getByText(/2023-04-30t16:00:00\.000z ~ 2023-05-02t15:59:59\.999z/i)).toBeInTheDocument();
      }
    });
  });

  it('non-UTC', async () => {
    const { container, getByPlaceholderText } = render(<App6 />);

    await sleep();

    const picker = container.querySelector('.ant-picker') as HTMLElement;
    const startInput = getByPlaceholderText('Start date');
    const endInput = getByPlaceholderText('End date');

    await userEvent.click(picker);
    await userEvent.click(document.querySelector('[title="2023-05-01"]') as HTMLElement);
    await userEvent.click(document.querySelector('[title="2023-05-02"]') as HTMLElement);

    expect(startInput).toHaveValue('2023-05-01');
    expect(endInput).toHaveValue('2023-05-02');
    // Read pretty
    expect(screen.getByText('2023-05-01~2023-05-02', { selector: '.ant-description-text' })).toBeInTheDocument();
    // Value
    expect(screen.getByText('2023-05-01 ~ 2023-05-02')).toBeInTheDocument();
  });

  it('showTime=false,gmt=true,utc=true', async () => {
    const { container } = render(<App7 />);

    await sleep();

    const picker = container.querySelector('.ant-picker') as HTMLElement;
    const input = container.querySelector('input') as HTMLElement;

    await userEvent.click(picker);
    await userEvent.type(input, '2023/05/01');
    await userEvent.click(document.querySelector('[title="2023-05-01"]') as HTMLElement);

    await waitFor(() => {
      expect(input).toHaveValue('2023/05/01');
      // Read pretty
      expect(screen.getByText('2023/05/01', { selector: '.ant-description-date-picker' })).toBeInTheDocument();

      // Value
      expect(screen.getByText('2023-05-01T00:00:00.000Z')).toBeInTheDocument();
    });
  });

  it('showTime=false,gmt=false,utc=true', async () => {
    const { container } = render(<App8 />);

    await sleep();

    const picker = container.querySelector('.ant-picker') as HTMLElement;
    const input = container.querySelector('input') as HTMLElement;

    await userEvent.click(picker);
    await userEvent.type(input, '2023/05/01');
    await userEvent.click(document.querySelector('[title="2023-05-01"]') as HTMLElement);

    await waitFor(() => {
      expect(input).toHaveValue('2023/05/01');
      // Read pretty
      expect(screen.getByText('2023/05/01', { selector: '.ant-description-date-picker' })).toBeInTheDocument();

      if (!process.env.GITHUB_ACTIONS) {
        // Value
        // 当 gmt 为 false 时是按照客户端本地时区进行计算的，但是这里的测试环境是 UTC+8，所以会有 8 小时的误差
        expect(screen.getByText('2023-04-30T16:00:00.000Z')).toBeInTheDocument();
      }
    });
  });

  it('showTime=false,gmt=true,utc=true & not input', async () => {
    const currentDateString = new Date().toISOString().split('T')[0];
    const { container } = render(<App9 />);

    await sleep();

    const picker = container.querySelector('.ant-picker') as HTMLElement;

    await userEvent.click(picker);
    const btn = document.querySelector(`[title="${currentDateString}"]`);
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn as HTMLElement);

    await waitFor(() => {
      // Read pretty
      expect(
        screen.getByText(currentDateString.replace(/-/g, '/'), { selector: '.ant-description-date-picker' }),
      ).toBeInTheDocument();

      // Value
      expect(screen.getByText(`${currentDateString}T00:00:00.000Z`)).toBeInTheDocument();
    });
  });
});
