import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Loading } from '../../client/components/loading';

describe('Loading', () => {
  it('renders one accessible loading status', () => {
    render(<Loading label='Loading page' />);

    expect(
      screen.getByRole('status', { name: 'Loading page' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('supports the standard fullscreen presentation', () => {
    render(<Loading fullscreen />);

    expect(screen.getByRole('status')).toHaveClass(
      'min-h-svh',
      'w-full',
      'bg-background',
    );
  });
});
