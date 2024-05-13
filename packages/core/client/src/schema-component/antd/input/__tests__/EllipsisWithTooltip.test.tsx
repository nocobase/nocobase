/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import { render, sleep, userEvent, waitFor, screen, act } from '@nocobase/test/client';
import { EllipsisWithTooltip } from '@nocobase/client';

describe('EllipsisWithTooltip Component', () => {
  const text = 'Text';

  const Demo = (props) => {
    const ref = useRef<any>();

    useEffect(() => {
      ref.current.setPopoverVisible(true);
    }, []);

    return (
      <EllipsisWithTooltip ref={ref} {...props}>
        {text}
      </EllipsisWithTooltip>
    );
  };

  function setHasEllipsis() {
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 200 });
  }

  function setNoEllipsis() {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 });
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 400 });
  }

  function resetEllipsis() {
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 0 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 0 });
  }

  async function noPopoverCheck() {
    expect(screen.queryByText(text)).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await act(async () => {
      await userEvent.hover(screen.getByText(text));
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  }

  async function hasPopoverCheck(popoverContent?: string) {
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await act(async () => {
      await userEvent.hover(screen.getByText(text));
    });

    await sleep(300);
    await waitFor(async () => {
      expect(screen.queryByRole('tooltip')).toHaveTextContent(popoverContent || text);
    });
  }

  const originalCreateRange: any = document.createRange;
  beforeAll(() => {
    const mockRange = {
      selectNodeContents: vitest.fn(),
      getBoundingClientRect: vitest.fn(() => ({
        width: 100,
      })),
    };
    document.createRange = vitest.fn(() => mockRange) as any;
  });

  afterAll(() => {
    document.createRange = originalCreateRange;
  });

  beforeEach(() => {
    resetEllipsis();
  });

  it('renders children without ellipsis by default', async () => {
    render(<Demo />);
    await noPopoverCheck();
  });

  it('shows Popover when ellipsis is true and content overflows', async () => {
    setHasEllipsis();

    render(<Demo ellipsis />);

    await hasPopoverCheck();
  });

  it('does not show Popover when content does not overflow', async () => {
    setNoEllipsis();

    render(<Demo ellipsis />);
    await noPopoverCheck();
  });

  it('uses popoverContent when provided', async () => {
    setHasEllipsis();

    const popoverContent = 'Custom Popover Content';

    render(<Demo ellipsis popoverContent={popoverContent} />);
    await hasPopoverCheck(popoverContent);
  });
});
