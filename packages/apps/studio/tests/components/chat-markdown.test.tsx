import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { MarkdownView } from '../../client/components/markdown-view';
import { ChatMarkdown } from '../../client/extensions/nocobase-agent-chat/chat-markdown';

function Location() {
  const location = useLocation();
  return (
    <output data-testid='location'>
      {location.pathname + location.search + location.hash}
    </output>
  );
}

function renderChat(content: string, base = '/main') {
  return render(
    <MemoryRouter
      basename={base}
      initialEntries={[`${base === '/' ? '' : base}/chat/123`]}
    >
      <ChatMarkdown content={content} />
      <Location />
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('links in chat Markdown', () => {
  it.each([
    ['/main', '/issues/PM-1'],
    ['/main', '/main/issues/PM-1'],
    ['/crm/studio', '/issues/PM-1'],
    ['/crm/studio', '/crm/studio/issues/PM-1'],
    ['/', '/issues/PM-1'],
  ])(
    'routes historical task links under %s without duplicating the base (%s)',
    async (base, path) => {
      renderChat(`[PM-1](${path}?tab=activity#comment-1 "Task details")`, base);
      const link = screen.getByRole('link', { name: 'PM-1' });
      expect(link).toHaveAttribute(
        'href',
        `${base === '/' ? '' : base}/issues/PM-1?tab=activity#comment-1`,
      );
      expect(link).toHaveAttribute('title', 'Task details');
      expect(link).not.toHaveAttribute('target');
      await userEvent.click(link);
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/issues/PM-1?tab=activity#comment-1',
      );
    },
  );

  it.each(['/projects/123/overview', '/main/projects/123/overview'])(
    'routes same-origin absolute project links (%s)',
    async (path) => {
      renderChat(`[Project](${window.location.origin}${path})`);
      const link = screen.getByRole('link', { name: 'Project' });
      expect(link).toHaveAttribute('href', '/main/projects/123/overview');
      await userEvent.click(link);
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/projects/123/overview',
      );
    },
  );

  it.each([
    'https://elsewhere.example/main/issues/PM-1',
    '//elsewhere.example/issues/PM-1',
    '/another-app/issues/PM-1',
    '/main-other/issues/PM-1',
    '/api/projects/123',
    '/main/api/projects/123',
    'mailto:help@example.com',
    '#heading',
    'guide.md',
  ])('preserves other links (%s)', (href) => {
    renderChat(`[Link](${href})`);
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('keeps mention chips and rejects unsafe URL schemes before routing', () => {
    renderChat('[Ada](mention://user/ada) [Unsafe](javascript:alert%281%29)');
    expect(screen.getByText('Ada')).toHaveAttribute('data-mention', 'user');
    expect(screen.getByText('Unsafe')).toHaveAttribute('href', '');
  });

  it('preserves plain Markdown links outside the chat without requiring a router', () => {
    render(<MarkdownView content='[Task](/issues/PM-1)' />);
    expect(screen.getByRole('link', { name: 'Task' })).toHaveAttribute(
      'href',
      '/issues/PM-1',
    );
    expect(screen.getByRole('link', { name: 'Task' })).toHaveAttribute(
      'target',
      '_blank',
    );
  });
});
