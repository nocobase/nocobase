/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Checkbox } from '@nocobase/client';
import { fireEvent, render, renderReadPrettyApp, screen, userEvent } from '@nocobase/test/client';
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

  describe('read pretty', () => {
    it('true', async () => {
      const { container } = await renderReadPrettyApp({
        Component: Checkbox,
        value: true,
      });

      expect(container.querySelector('svg')).toMatchInlineSnapshot(`
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
    });

    it('false', async () => {
      const { container } = await renderReadPrettyApp({
        Component: Checkbox,
        value: false,
      });

      expect(container.querySelector('svg')).toBeFalsy();
    });

    it('false and showUnchecked', async () => {
      const { container } = await renderReadPrettyApp({
        Component: Checkbox,
        value: false,
        props: {
          showUnchecked: true,
        },
      });

      expect(container.querySelector('svg')).toMatchInlineSnapshot(`
        <svg
          aria-hidden="true"
          data-icon="close"
          fill="currentColor"
          fill-rule="evenodd"
          focusable="false"
          height="1em"
          viewBox="64 64 896 896"
          width="1em"
        >
          <path
            d="M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .03-.02.05-.06.09L569.93 512l287.7 287.7c.04.04.05.06.06.09a.12.12 0 010 .07c0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.05-.09.06a.12.12 0 01-.07 0c-.02 0-.04-.02-.08-.06l-57.69-57.7c-.04-.03-.05-.05-.06-.07a.12.12 0 010-.07c0-.03.02-.05.06-.09L454.07 512l-287.7-287.7c-.04-.04-.05-.06-.06-.09a.12.12 0 010-.07c0-.02.02-.04.06-.08l57.7-57.69c.03-.04.05-.05.07-.06a.12.12 0 01.07 0c.03 0 .05.02.09.06L512 454.07l287.7-287.7c.04-.04.06-.05.09-.06a.12.12 0 01.07 0z"
          />
        </svg>
      `);
    });
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

    fireEvent.click(option1);

    expect(Array.from(container.querySelectorAll('.ant-tag')).map((el) => el.innerHTML)).toMatchInlineSnapshot(`
      [
        "选项1",
      ]
    `);

    fireEvent.click(option2);

    expect(Array.from(container.querySelectorAll('.ant-tag')).map((el) => el.innerHTML)).toMatchInlineSnapshot(`
      [
        "选项1",
        "选项2",
      ]
    `);

    // should be hidden when unchecked
    fireEvent.click(option1);
    fireEvent.click(option2);
    expect(container.querySelectorAll('.ant-tag')).toMatchInlineSnapshot(`NodeList []`);
  });
});
