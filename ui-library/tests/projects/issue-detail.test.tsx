import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  IssueDeleteButton,
  IssueDetailLayout,
  IssueHeader,
} from '../../registry/projects/issue-detail/issue-detail';

const TODO = { name: 'Todo', color: 'gray' } as const;

describe('IssueDetailLayout', () => {
  it('follows its own width through a container query, not the viewport', () => {
    const { container } = render(
      <IssueDetailLayout
        main={<p>Main</p>}
        aside={<p>Aside</p>}
        asideLabel='Properties'
      />,
    );
    const layout = container.querySelector('[data-slot="issue-detail-layout"]');
    expect(layout).not.toBeNull();
    expect(layout).toHaveClass('@container/issue-detail');
    expect(layout).toHaveClass('@4xl/issue-detail:flex-row');
    const aside = screen.getByRole('complementary', { name: 'Properties' });
    expect(aside).toHaveClass('@4xl/issue-detail:w-[20rem]');
    expect(aside).toHaveClass('@4xl/issue-detail:shrink-0');
  });
});

describe('IssueHeader', () => {
  it('establishes its own named container so its actions can respond to its own width', () => {
    const { container } = render(
      <IssueHeader
        identifier='PM-65'
        title='A long title that would otherwise be squeezed by the actions beside it'
        status={TODO}
        actions={<button type='button'>Ask agent</button>}
      />,
    );
    expect(container.querySelector('[data-slot="issue-header"]')).toHaveClass(
      '@container/issue-header',
    );
    expect(screen.getByRole('button', { name: 'Ask agent' })).toBeTruthy();
  });
});

describe('IssueDeleteButton', () => {
  it('keeps the label reachable by name and tooltip even when the container hides it visually', async () => {
    const onDelete = vi.fn(() => Promise.resolve());
    render(<IssueDeleteButton identifier='PM-65' onDelete={onDelete} />);
    const button = screen.getByRole('button', { name: 'Delete' });
    // The label text is hidden below the issue header's own `@md`, not the viewport; the accessible name and the
    // tooltip still carry it so the action is still discoverable when only the icon shows.
    expect(button.querySelector('span')).toHaveClass('@md/issue-header:inline');
    fireEvent.click(button);
    expect(await screen.findByText('Delete PM-65?')).toBeTruthy();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
