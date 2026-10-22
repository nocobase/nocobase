import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { RecordLink } from '../../registry/components/record-link.js';

function Destination() {
  const location = useLocation();
  return (
    <output>
      {location.pathname}
      {location.search}
    </output>
  );
}

describe('record links', () => {
  it('keeps native anchor props and forwards its ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <MemoryRouter>
        <RecordLink
          ref={ref}
          to='/records/42?q=open'
          target='_blank'
          rel='noopener'
          title='Open record'
        >
          Record 42
        </RecordLink>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Record 42' });
    expect(ref.current).toBe(link);
    expect(link).toHaveAttribute('href', '/records/42?q=open');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
    expect(link).toHaveAttribute('title', 'Open record');
  });

  it('opens the record by keyboard and retains its list query', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/records?q=open']}>
        <RecordLink to={{ pathname: '/records/42', search: '?q=open' }}>
          Record 42
        </RecordLink>
        <Destination />
      </MemoryRouter>,
    );
    await user.tab();
    expect(screen.getByRole('link', { name: 'Record 42' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('/records/42?q=open');
  });
});
