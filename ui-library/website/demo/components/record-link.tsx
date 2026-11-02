import type { ReactElement } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { RecordLink } from '#components/record-link';

function RecordFields(): ReactElement {
  const location = useLocation();
  return (
    <section className='space-y-4 p-6 text-foreground'>
      <h2 className='text-base font-medium'>Record links</h2>
      <p className='text-sm text-muted-foreground'>
        Hover over a name or focus it with Tab, then press Enter to open it.
      </p>
      <ul className='space-y-3'>
        <li>
          <RecordLink to={{ pathname: '/records/42', search: '?status=open' }}>
            BX-202610-0042
          </RecordLink>
        </li>
        <li>
          <RecordLink
            to={{ pathname: '/users/alex/edit', search: '?status=enabled' }}
          >
            Alex Chen
          </RecordLink>
        </li>
      </ul>
      <output className='block break-all text-sm text-muted-foreground'>
        {location.pathname}
        {location.search}
      </output>
    </section>
  );
}

export function RecordLinkDemo(): ReactElement {
  return (
    <MemoryRouter>
      <RecordFields />
    </MemoryRouter>
  );
}
