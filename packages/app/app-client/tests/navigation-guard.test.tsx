import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  useContext,
  useLayoutEffect,
  useState,
  type ReactElement,
} from 'react';
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  UNSAFE_NavigationContext,
  useLocation,
  useNavigate,
} from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { NavigationGuardProvider } from '../src/navigation-guard-provider.js';
import { useNavigationGuard } from '../src/navigation-guard.js';

function Editor({ decide }: { readonly decide: () => boolean }): ReactElement {
  const [draft, setDraft] = useState('');
  const navigate = useNavigate();
  useNavigationGuard(decide);
  return (
    <>
      <input
        aria-label='Draft'
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <Link to='/list'>Leave</Link>
      <button onClick={() => navigate(-1)}>Back</button>
    </>
  );
}

function LocationProbe(): ReactElement {
  return <output data-testid='outer-location'>{useLocation().pathname}</output>;
}

function Example({ decide }: { readonly decide: () => boolean }): ReactElement {
  return (
    <NavigationGuardProvider>
      <Routes>
        <Route path='/list' element={<Link to='/edit'>Open</Link>} />
        <Route path='/edit' element={<Editor decide={decide} />} />
      </Routes>
    </NavigationGuardProvider>
  );
}

describe('host navigation guards', () => {
  it('retains the editor on rejected memory traversal and releases it when accepted', async () => {
    const decide = vi.fn(() => false);
    render(
      <MemoryRouter initialEntries={['/list']}>
        <LocationProbe />
        <Example decide={decide} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Open'));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Draft' }), {
      target: { value: 'Keep me' },
    });
    fireEvent.click(screen.getByText('Back'));
    await waitFor(() => expect(decide).toHaveBeenCalledOnce());
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue(
      'Keep me',
    );
    // Wait for restoration before accepting the next navigation.
    await waitFor(() =>
      expect(screen.getByTestId('outer-location')).toHaveTextContent('/edit'),
    );
    decide.mockReturnValue(true);
    fireEvent.click(screen.getByText('Leave'));
    expect(await screen.findByText('Open')).toBeInTheDocument();
  });

  it('keeps the outer router navigator unchanged and removes unmounted guards', async () => {
    const decide = vi.fn(() => true);
    let originalPush: unknown;
    let readPush: () => unknown = () => undefined;
    function Inspect(): ReactElement {
      const { navigator } = useContext(UNSAFE_NavigationContext);
      useLayoutEffect(() => {
        originalPush = navigator.push;
        readPush = () => navigator.push;
      }, [navigator]);
      return <Example decide={decide} />;
    }
    render(
      <MemoryRouter initialEntries={['/list']}>
        <Inspect />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Open'));
    await screen.findByRole('textbox', { name: 'Draft' });
    expect(readPush()).toBe(originalPush);
    fireEvent.click(screen.getByText('Leave'));
    await screen.findByText('Open');
    expect(decide).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('Open'));
    await screen.findByRole('textbox', { name: 'Draft' });
    expect(decide).toHaveBeenCalledOnce();
  });
});
