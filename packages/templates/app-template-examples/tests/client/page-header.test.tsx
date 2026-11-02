import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageHeader } from '../../client/components/page-header.js';

describe('PageHeader', () => {
  it('renders the title, description, and right-aligned actions', () => {
    render(
      <PageHeader
        title='Route dialogs and drawers'
        description='Explore URL-addressable overlays.'
        actions={<button type='button'>Create example</button>}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Route dialogs and drawers',
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Explore URL-addressable overlays.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create example' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button').parentElement).toHaveClass(
      'flex',
      'items-center',
      'gap-2',
    );
  });

  it('omits an empty description and actions area', () => {
    render(<PageHeader title='Only a title' />);

    expect(screen.getByRole('heading', { name: 'Only a title' })).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
