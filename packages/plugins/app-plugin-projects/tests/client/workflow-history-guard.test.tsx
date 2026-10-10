import { NavigationGuardProvider } from '@nocobase/app-client';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { StrictMode, useState, type ReactElement } from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useWorkflowLeaveGuard } from '../../client/hooks/use-workflow-leave-guard.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function Editor(): ReactElement {
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);
  useWorkflowLeaveGuard(value !== '', pending, 'Discard unsaved changes?');
  const navigate = useNavigate();
  return (
    <>
      <input
        aria-label='Draft'
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button onClick={() => navigate('/other', { replace: true })}>
        Replace
      </button>
      <button onClick={() => setPending(true)}>Start saving</button>
      <Link to='/other'>Other page</Link>
    </>
  );
}

async function setup(): Promise<{ home: unknown; list: unknown }> {
  window.history.replaceState({ idx: 0 }, '', '/home');
  render(
    <StrictMode>
      <BrowserRouter>
        <NavigationGuardProvider>
          <Routes>
            <Route path='/home' element={<Link to='/list'>Workflows</Link>} />
            <Route path='/edit' element={<Editor />} />
            <Route
              path='/list'
              element={
                <>
                  <p>Workflow list</p>
                  <Link to='/edit'>Open editor</Link>
                </>
              }
            />
            <Route path='/other' element={<p>Other destination</p>} />
          </Routes>
        </NavigationGuardProvider>
      </BrowserRouter>
    </StrictMode>,
  );
  const home: unknown = window.history.state;
  fireEvent.click(screen.getByText('Workflows'));
  await screen.findByText('Open editor');
  const list: unknown = window.history.state;
  fireEvent.click(screen.getByText('Open editor'));
  await screen.findByRole('textbox', { name: 'Draft' });
  fireEvent.change(screen.getByRole('textbox', { name: 'Draft' }), {
    target: { value: 'Keep this draft' },
  });
  return { home, list };
}

describe('workflow browser history guard', () => {
  it('preserves a returning editor on repeated Back after the host router has mounted', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await setup();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      window.history.back();
      await waitFor(() => expect(confirm).toHaveBeenCalledTimes(attempt + 1));
      await waitFor(() => expect(window.location.pathname).toBe('/edit'));
      expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue(
        'Keep this draft',
      );
      expect(screen.queryByText('Workflow list')).not.toBeInTheDocument();
    }
  });

  it('corrects another POP arriving during restoration without leaving navigation locked', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { home, list } = await setup();
    // Model browser traversal notifications after its own location listener has already run.
    const originalState: unknown = window.history.state;
    const go = vi
      .spyOn(window.history, 'go')
      .mockImplementation(() => undefined);
    for (const [state, idx, path] of [
      [list, 1, '/list'],
      [home, 0, '/home'],
      [list, 1, '/list'],
    ] as const) {
      await act(async () => {
        window.history.replaceState(state, '', path);
        window.dispatchEvent(new PopStateEvent('popstate', { state }));
      });
      await waitFor(() => expect(go).toHaveBeenLastCalledWith(2 - idx));
      expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue(
        'Keep this draft',
      );
    }
    await act(async () => {
      window.history.replaceState(originalState, '', '/edit');
      window.dispatchEvent(
        new PopStateEvent('popstate', { state: window.history.state }),
      );
    });
    go.mockRestore();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByText('Other page'));
    expect(await screen.findByText('Other destination')).toBeInTheDocument();
  });

  it('retains the mounted draft and restores the URL after declining browser Back, then allows Back and Forward', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await setup();
    window.history.back();
    await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    await waitFor(() => expect(window.location.pathname).toBe('/edit'));
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue(
      'Keep this draft',
    );
    confirm.mockReturnValue(true);
    window.history.back();
    expect(await screen.findByText('Workflow list')).toBeInTheDocument();
    expect(confirm).toHaveBeenCalledTimes(2);
    window.history.forward();
    expect(await screen.findByRole('textbox', { name: 'Draft' })).toHaveValue(
      '',
    );
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it('guards programmatic replace and releases its listeners after leaving', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await setup();
    fireEvent.click(screen.getByText('Replace'));
    expect(window.location.pathname).toBe('/edit');
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByText('Replace'));
    expect(await screen.findByText('Other destination')).toBeInTheDocument();
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('keeps navigation in place while a save is pending', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const go = vi.spyOn(window.history, 'go');
    await setup();
    fireEvent.click(screen.getByText('Start saving'));
    fireEvent.click(screen.getByText('Other page'));
    expect(window.location.pathname).toBe('/edit');
    window.history.back();
    await waitFor(() => expect(go).toHaveBeenCalledWith(1));
    await waitFor(() => expect(window.location.pathname).toBe('/edit'));
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue(
      'Keep this draft',
    );
    expect(confirm).not.toHaveBeenCalled();
  });
});
