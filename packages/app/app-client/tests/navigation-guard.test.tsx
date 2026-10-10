import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  useContext,
  useLayoutEffect,
  useState,
  type ReactElement,
} from 'react';
import {
  BrowserRouter,
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
      <button onClick={() => navigate('/list', { replace: true })}>
        Replace
      </button>
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
  it.each(['/', '/main', '/main/'])(
    'recovers rejected traversal between entries sharing an index after a native hash at basename %s',
    async (basename) => {
      const prefix = basename.replace(/\/$/, '');
      window.history.replaceState({ idx: 0 }, '', `${prefix}/home`);
      const decide = vi.fn(() => false);
      render(
        <BrowserRouter basename={basename}>
          <LocationProbe />
          <NavigationGuardProvider>
            <Routes>
              <Route path='/home' element={<Link to='/list'>Workflows</Link>} />
              <Route
                path='/list'
                element={
                  <>
                    <Link to='/edit/first'>First workflow</Link>
                    <Link to='/edit/second'>Second workflow</Link>
                  </>
                }
              />
              <Route path='/edit/:id' element={<Editor decide={decide} />} />
            </Routes>
          </NavigationGuardProvider>
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText('Workflows'));
      fireEvent.click(await screen.findByText('First workflow'));
      fireEvent.change(await screen.findByRole('textbox', { name: 'Draft' }), {
        target: { value: 'First draft' },
      });
      expect(window.history.state?.idx).toBe(2);
      act(() => {
        window.location.hash = 'outside-router';
      });
      await waitFor(() => expect(decide).toHaveBeenCalledOnce());
      await waitFor(() => expect(window.location.hash).toBe(''));
      expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue(
        'First draft',
      );

      decide.mockReturnValue(true);
      fireEvent.click(screen.getByText('Leave'));
      fireEvent.click(await screen.findByText('Second workflow'));
      fireEvent.change(await screen.findByRole('textbox', { name: 'Draft' }), {
        target: { value: 'Keep second draft' },
      });
      decide.mockReturnValue(false);
      decide.mockClear();
      // The native hash entry reset the router index: both editor entries now have idx=2.
      expect(window.history.state?.idx).toBe(2);
      act(() => window.history.go(-3));
      await waitFor(() => expect(decide).toHaveBeenCalledOnce());
      await waitFor(() =>
        expect(window.location.pathname).toBe(`${prefix}/edit/second`),
      );
      expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue(
        'Keep second draft',
      );

      // Restoration must both keep the guard active and release its navigation lock.
      fireEvent.click(screen.getByText('Leave'));
      fireEvent.click(screen.getByText('Replace'));
      expect(decide).toHaveBeenCalledTimes(3);
      expect(window.location.pathname).toBe(`${prefix}/edit/second`);
      decide.mockReturnValue(true);
      fireEvent.click(screen.getByText('Replace'));
      expect(await screen.findByText('First workflow')).toBeInTheDocument();
      expect(window.location.pathname).toBe(`${prefix}/list`);
      fireEvent.click(screen.getByText('First workflow'));
      expect(await screen.findByRole('textbox', { name: 'Draft' })).toHaveValue(
        '',
      );
    },
  );

  it.each(['/', '/main', '/main/'])(
    'preserves basename %s and checks guards again after rejecting a native hash entry',
    async (basename) => {
      const prefix = basename.replace(/\/$/, '');
      window.history.replaceState({ idx: 0 }, '', `${prefix}/list`);
      const decide = vi.fn(() => false);
      render(
        <BrowserRouter basename={basename}>
          <LocationProbe />
          <Example decide={decide} />
        </BrowserRouter>,
      );
      fireEvent.click(screen.getByText('Open'));
      fireEvent.change(await screen.findByRole('textbox', { name: 'Draft' }), {
        target: { value: 'Keep hash draft' },
      });
      act(() => {
        window.location.hash = 'outside-router';
      });
      await waitFor(() => expect(decide).toHaveBeenCalledOnce());
      await waitFor(() => {
        expect(window.location.pathname).toBe(`${prefix}/edit`);
        expect(window.location.hash).toBe('');
      });
      expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue(
        'Keep hash draft',
      );
      // The restored hash entry duplicates the original editor entry; traverse both before leaving.
      act(() => window.history.back());
      await waitFor(() => expect(window.history.state?.idx).toBe(1));
      act(() => window.history.back());
      await waitFor(() => expect(decide).toHaveBeenCalledTimes(2));
      await waitFor(() =>
        expect(screen.getByTestId('outer-location')).toHaveTextContent('/edit'),
      );
      expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue(
        'Keep hash draft',
      );
      decide.mockReturnValue(true);
      fireEvent.click(screen.getByText('Leave'));
      expect(await screen.findByText('Open')).toBeInTheDocument();
      expect(window.location.pathname).toBe(`${prefix}/list`);
    },
  );

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
