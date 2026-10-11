import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { expect, it } from 'vitest';

import { RouteTabs } from '../../client/components/route-tabs';

it('selects the tab of the current child route and links to the others, keeping the query', () => {
  render(
    <MemoryRouter initialEntries={['/page/owned?q=1']}>
      <Routes>
        <Route
          path='/page'
          element={
            <RouteTabs
              label='Tabs'
              tabs={[
                { path: 'owned', label: 'Owned' },
                { path: 'executing', label: 'Executing' },
              ]}
            />
          }
        >
          <Route path='*' element={null} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  const executing = screen.getByRole('tab', { name: 'Executing' });
  expect(screen.getByRole('tab', { name: 'Owned' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(executing).toHaveAttribute('href', '/page/executing?q=1');
  fireEvent.click(executing);
  expect(executing).toHaveAttribute('aria-selected', 'true');
});
