import { Activity, useState, useLayoutEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router';
import { renderWithApp } from '@nocobase/app-testing/client';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import {
  RouteLeaveBoundary,
  usePageLeave,
} from '../../client/routing/route-leave-boundary.js';
import enUS from '../../client/locales/en-US.js';
import metadata from '../../package.json' with { type: 'json' };

it('cancels a shell leave confirmation on concealment and requires a fresh decision after recovery', async () => {
  let conceal: (hidden: boolean) => void;
  function Editor() {
    const leave = usePageLeave(true, false);
    return (
      <>
        <p>Unsaved editor</p>
        {leave.dialog}
      </>
    );
  }
  function Harness() {
    const [hidden, setHidden] = useState(false);
    useLayoutEffect(() => {
      conceal = setHidden;
    }, []);
    return (
      <RouteLeaveBoundary hidden={hidden}>
        <Link to='/other'>Leave page</Link>
        <output data-testid='location'>{useLocation().pathname}</output>
        <Routes>
          <Route
            path='/editor'
            element={
              <Activity mode={hidden ? 'hidden' : 'visible'}>
                <Editor />
              </Activity>
            }
          />
          <Route path='/other' element={<p>Other page</p>} />
        </Routes>
      </RouteLeaveBoundary>
    );
  }
  const user = userEvent.setup();
  await renderWithApp(<Harness />, {
    route: '/editor',
    namespace: metadata.name,
    namespaces: { [metadata.name]: enUS },
  });
  await user.click(screen.getByRole('link', { name: 'Leave page' }));
  await screen.findByRole('alertdialog');
  await act(async () => conceal(true));
  expect(screen.queryByRole('alertdialog')).toBeNull();
  await user.click(screen.getByRole('link', { name: 'Leave page' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/editor');
  const unload = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(unload);
  expect(unload.defaultPrevented).toBe(true);
  await act(async () => conceal(false));
  expect(screen.getByText('Unsaved editor')).toBeVisible();
  expect(screen.getByTestId('location')).toHaveTextContent('/editor');
  expect(screen.queryByRole('alertdialog')).toBeNull();
  await user.click(screen.getByRole('link', { name: 'Leave page' }));
  const question = await screen.findByRole('alertdialog');
  await user.click(within(question).getByRole('button', { name: 'Confirm' }));
  await waitFor(() => expect(screen.getByText('Other page')).toBeVisible());
  const after = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(after);
  expect(after.defaultPrevented).toBe(false);
});
