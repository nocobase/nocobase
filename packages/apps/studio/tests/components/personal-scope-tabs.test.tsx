import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { RouteTabs } from '../../client/components/route-tabs.js';

afterEach(cleanup);
function PersonalScopes() {
  return (
    <>
      <RouteTabs
        keepHash
        label='Personal scope'
        tabs={[
          { path: 'owned', label: 'Owned' },
          { path: 'executing', label: 'Executing' },
        ]}
      />
      <Outlet />
    </>
  );
}
function Location() {
  const location = useLocation();
  return (
    <output>
      {location.pathname}
      {location.search}
      {location.hash}
    </output>
  );
}

describe('personal scope links', () => {
  it('retains task selection, query and fragment while changing the owner/executor child route', () => {
    render(
      <MemoryRouter
        initialEntries={['/my-issues/owned?view=list&q=keep&issue=A#reply']}
      >
        <Routes>
          <Route path='/my-issues' element={<PersonalScopes />}>
            <Route path='owned' element={<Location />} />
            <Route path='executing' element={<Location />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const execute = screen.getByRole('tab', { name: 'Executing' });
    expect(execute).toHaveAttribute(
      'href',
      '/my-issues/executing?view=list&q=keep&issue=A#reply',
    );
    fireEvent.click(execute);
    expect(
      screen.getByText('/my-issues/executing?view=list&q=keep&issue=A#reply'),
    ).toBeVisible();
  });
});
