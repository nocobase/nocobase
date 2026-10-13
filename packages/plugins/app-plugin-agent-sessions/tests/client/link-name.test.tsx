import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { MemoryRouter, useLocation } from 'react-router';

import { LinkName } from '../../client/components/link-name.js';
import type { SessionLink } from '../../shared/api.js';

const link: SessionLink = {
  kind: 'issue',
  refId: 'issue-1',
  key: 'ST-346',
  title:
    'A very long mixed title 标题 mixed with English that should wrap inside the viewport',
  group: 'Studio',
  status: 'in_progress',
  href: '/issues/issue-1',
  startable: false,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Location(): ReactElement {
  return <output>{useLocation().pathname}</output>;
}

function renderLink(): void {
  render(
    <MemoryRouter>
      <LinkName link={link} />
      <Location />
    </MemoryRouter>,
  );
}

describe('LinkName', () => {
  it('shows a wrapped full title on hover and keyboard focus only when truncated', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(80);
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.textContent === link.title ? 320 : 80;
      },
    );

    renderLink();
    const entry = screen.getByRole('link');
    fireEvent.pointerEnter(entry, { pointerType: 'mouse' });
    const tooltip = await waitFor(() => {
      const element = document.querySelector('[data-slot="tooltip-content"]');
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    expect(tooltip).toHaveTextContent(link.title);
    expect(tooltip).toHaveClass('whitespace-normal');
    expect(tooltip).toHaveClass('[overflow-wrap:anywhere]');

    fireEvent.pointerLeave(entry);
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="tooltip-content"]'),
      ).toBeNull(),
    );
    fireEvent.focus(entry);
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="tooltip-content"]'),
      ).toHaveTextContent(link.title),
    );
    fireEvent.blur(entry);
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="tooltip-content"]'),
      ).toBeNull(),
    );
  });

  it('keeps navigation working from the tooltip trigger', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500);
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(80);

    renderLink();
    fireEvent.click(screen.getByRole('link'));
    expect(screen.getByText('/issues/issue-1')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();
  });
});
