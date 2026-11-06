import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusBadge } from '#components/status-badge';

// The two badge sizes are drawn by client/styles.css from `data-size`, which jsdom does not apply, so this checks the
// attribute that selects them.
describe('StatusBadge', () => {
  it('is the default badge unless asked for the small one', () => {
    render(
      <>
        <StatusBadge tone='success'>Done</StatusBadge>
        <StatusBadge tone='warning' size='sm'>
          Waiting
        </StatusBadge>
      </>,
    );
    expect(screen.getByText('Done')).not.toHaveAttribute('data-size');
    expect(screen.getByText('Waiting')).toHaveAttribute('data-size', 'sm');
    expect(screen.getByText('Waiting')).toHaveAttribute('data-slot', 'badge');
  });
});
