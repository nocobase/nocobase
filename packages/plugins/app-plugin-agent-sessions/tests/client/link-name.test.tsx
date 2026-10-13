import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router';

import { LinkName } from '../../client/components/link-name.js';
import type { SessionLink } from '../../shared/api.js';

const link: SessionLink = {
  kind: 'issue',
  refId: 'issue-1',
  key: 'ST-346',
  title: '任务标题 Mixed English and 中文内容 for the session work list',
  group: 'Studio',
  status: { label: 'In progress', tone: 'active' },
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

function renderLink(value: SessionLink = link): void {
  render(
    <MemoryRouter>
      <LinkName link={value} />
      <Location />
    </MemoryRouter>,
  );
}

function mockWidth(title: string, truncated: boolean): void {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(80);
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.textContent === title && truncated ? 800 : 80;
    },
  );
}

function tooltip(): HTMLElement | null {
  return document.querySelector('[data-slot="tooltip-content"]');
}

describe('LinkName', () => {
  it('shows the complete long title on keyboard focus, then closes', async () => {
    const title = '任务标题 Mixed English and 中文内容 '.repeat(30);
    mockWidth(title, true);
    renderLink({ ...link, title });

    const entry = screen.getByRole('link');
    fireEvent.focus(entry);
    await waitFor(() => expect(tooltip()?.textContent).toBe(title));
    expect(tooltip()).toHaveClass('overflow-y-auto');

    fireEvent.blur(entry);
    await waitFor(() => expect(tooltip()).toBeNull());
  });

  it('does not open for a short title on keyboard focus', async () => {
    mockWidth(link.title, false);
    renderLink();

    const entry = screen.getByRole('link');
    fireEvent.focus(entry);
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(tooltip()).toBeNull();
  });

  it('shows an unlinked truncated title on keyboard focus without creating a link', async () => {
    mockWidth(link.title, true);
    renderLink({ ...link, href: null });

    const entry = screen.getByText(link.title).parentElement;
    expect(screen.queryByRole('link')).toBeNull();
    fireEvent.focus(entry!);
    await waitFor(() => expect(tooltip()).toHaveTextContent(link.title));
  });

  it('keeps navigation working from a truncated title', async () => {
    mockWidth(link.title, true);
    renderLink();

    const entry = screen.getByRole('link');
    fireEvent.click(entry);
    expect(screen.getByText('/issues/issue-1')).toBeInTheDocument();
  });
});
