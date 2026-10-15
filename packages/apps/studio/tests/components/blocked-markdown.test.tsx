import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IssueMarkdown } from '../../client/issues/markdown.js';

describe('blocked explanation Markdown', () => {
  it('renders mention chips, safe links and code rather than Markdown source', () => {
    const { container } = render(
      <IssueMarkdown
        content={
          '[@Test operator](mention://user/test-operator) Restore the disk. [Runbook](https://example.com/runbook)\n\nUse `df -h`.\n\n```sh\ndf -h\n```'
        }
      />,
    );
    expect(screen.getByText('@Test operator')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Runbook' })).toHaveAttribute(
      'href',
      'https://example.com/runbook',
    );
    expect(container.querySelectorAll('code')).toHaveLength(2);
    expect(container.textContent).not.toContain('mention://');
  });
});
