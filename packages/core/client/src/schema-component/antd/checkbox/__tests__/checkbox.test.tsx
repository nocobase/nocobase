import { render, screen, userEvent } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/checkbox';
import App2 from '../demos/checkbox.group';

describe('Checkbox', () => {
  it('should display the title', () => {
    render(<App1 />);

    expect(screen.getByText('编辑模式').innerHTML).toBe('编辑模式');
    expect(screen.getByText('阅读模式').innerHTML).toBe('阅读模式');
  });

  it('should display the icon when checked', async () => {
    const { container } = render(<App1 />);

    const input = container.querySelector('input') as HTMLInputElement;
    await userEvent.click(input);
    const icon = container.querySelector('svg') as SVGElement;
    expect(icon).toMatchInlineSnapshot(`
      <svg
        aria-hidden="true"
        data-icon="check"
        fill="currentColor"
        focusable="false"
        height="1em"
        viewBox="64 64 896 896"
        width="1em"
      >
        <path
          d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"
        />
      </svg>
    `);

    // icon should be hidden when unchecked
    await userEvent.click(input);
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('Checkbox.Group', () => {
  it('should display the title', () => {
    render(<App2 />);

    expect(screen.getByText('编辑模式').innerHTML).toBe('编辑模式');
    expect(screen.getByText('阅读模式').innerHTML).toBe('阅读模式');
  });

  it('should display the tag when checked', async () => {
    const { container } = render(<App2 />);

    const option1 = screen.getByLabelText('选项1');
    const option2 = screen.getByLabelText('选项2');
    await userEvent.click(option1);
    expect(Array.from(container.querySelectorAll('.ant-tag')).map((el) => el.innerHTML)).toMatchInlineSnapshot(`
      [
        "选项1",
      ]
    `);
    await userEvent.click(option2);
    expect(Array.from(container.querySelectorAll('.ant-tag')).map((el) => el.innerHTML)).toMatchInlineSnapshot(`
      [
        "选项1",
        "选项2",
      ]
    `);

    // should be hidden when unchecked
    await userEvent.click(option1);
    await userEvent.click(option2);
    expect(container.querySelectorAll('.ant-tag')).toMatchInlineSnapshot(`NodeList []`);
  });
});
