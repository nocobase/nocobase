import { render, screen } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/antd-icon';
import App3 from '../demos/custom-icon';
import App2 from '../demos/iconfont';
import App4 from '../demos/register-icon';

describe('Icon', () => {
  it('antd icon', () => {
    render(<App1 />);
    expect(screen.getByRole('img')).toMatchInlineSnapshot(`
      <span
        aria-label="book"
        class="anticon anticon-book"
        role="img"
      >
        <svg
          aria-hidden="true"
          data-icon="book"
          fill="currentColor"
          focusable="false"
          height="1em"
          viewBox="64 64 896 896"
          width="1em"
        >
          <path
            d="M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-260 72h96v209.9L621.5 312 572 347.4V136zm220 752H232V136h280v296.9c0 3.3 1 6.6 3 9.3a15.9 15.9 0 0022.3 3.7l83.8-59.9 81.4 59.4c2.7 2 6 3.1 9.4 3.1 8.8 0 16-7.2 16-16V136h64v752z"
          />
        </svg>
      </span>
    `);
  });

  it('iconfont', () => {
    render(<App2 />);
    expect(screen.getByRole('img')).toMatchInlineSnapshot(`
      <span
        class="anticon"
        role="img"
      >
        <svg
          aria-hidden="true"
          class=""
          fill="currentColor"
          focusable="false"
          height="1em"
          width="1em"
        >
          <use
            xlink:href="#icon-tuichu"
          />
        </svg>
      </span>
    `);
  });

  it('custom icon', () => {
    render(<App3 />);
    expect(screen.getByRole('img')).toMatchInlineSnapshot(`
      <span
        class="anticon"
        role="img"
      >
        <svg
          fill="currentColor"
          height="1em"
          viewBox="0 0 1024 1024"
          width="1em"
        >
          <path
            d="M923 283.6c-13.4-31.1-32.6-58.9-56.9-82.8-24.3-23.8-52.5-42.4-84-55.5-32.5-13.5-66.9-20.3-102.4-20.3-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5-24.4 23.9-43.5 51.7-56.9 82.8-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3 0.1-35.3-7-69.6-20.9-101.9z"
          />
        </svg>
      </span>
    `);
  });

  it('register icon', () => {
    render(<App4 />);
    expect(screen.getByRole('img')).toMatchInlineSnapshot(`
      <span
        class="anticon"
        role="img"
      >
        <svg
          fill="currentColor"
          height="1em"
          viewBox="0 0 1024 1024"
          width="1em"
        >
          <path
            d="M923 283.6c-13.4-31.1-32.6-58.9-56.9-82.8-24.3-23.8-52.5-42.4-84-55.5-32.5-13.5-66.9-20.3-102.4-20.3-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5-24.4 23.9-43.5 51.7-56.9 82.8-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3 0.1-35.3-7-69.6-20.9-101.9z"
          />
        </svg>
      </span>
    `);
  });
});
