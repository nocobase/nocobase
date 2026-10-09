import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

function setup(): void {
  window.history.replaceState({ idx: 0 }, '', '/list');
  window.history.pushState({ idx: 1 }, '', '/edit');
  render(
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path='/edit' element={<Editor />} />
          <Route path='/list' element={<p>Workflow list</p>} />
          <Route path='/other' element={<p>Other destination</p>} />
        </Routes>
      </BrowserRouter>
    </StrictMode>,
  );
  fireEvent.change(screen.getByRole('textbox', { name: 'Draft' }), {
    target: { value: 'Keep this draft' },
  });
}

describe('workflow browser history guard', () => {
  it('cancels native navigation before the router can unmount a returning editor', () => {
    const navigation = new EventTarget();
    vi.stubGlobal('navigation', navigation);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    setup();
    const traversal = () =>
      Object.assign(new Event('navigate', { cancelable: true }), {
        navigationType: 'traverse',
        destination: { sameDocument: true },
      });
    const declined = traversal();
    navigation.dispatchEvent(declined);
    expect(declined.defaultPrevented).toBe(true);
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue(
      'Keep this draft',
    );
    confirm.mockReturnValue(true);
    const accepted = traversal();
    navigation.dispatchEvent(accepted);
    expect(accepted.defaultPrevented).toBe(false);
    window.dispatchEvent(
      new PopStateEvent('popstate', { state: window.history.state }),
    );
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it('retains the mounted draft and restores the URL after declining browser Back, then allows Back and Forward', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    setup();
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
    setup();
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
    setup();
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
