import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState, type ReactElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  UnsavedChangesContext,
  useGuardedClose,
  useUnsavedChanges,
  useUnsavedChangesGuard,
  type UnsavedChangesGuard,
} from '../src/index.js';

afterEach(cleanup);

/** A boundary as a plugin renders one: the scope, and the question while asking. */
function Boundary({
  guard,
  children,
}: {
  readonly guard: UnsavedChangesGuard;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <UnsavedChangesContext.Provider value={guard.scope}>
      {children}
      {guard.asking ? (
        <div role='alertdialog'>
          <button type='button' onClick={() => guard.answer(false)}>
            keep
          </button>
          <button type='button' onClick={() => guard.answer(true)}>
            discard
          </button>
        </div>
      ) : null}
    </UnsavedChangesContext.Provider>
  );
}

function Form({ onSaved }: { readonly onSaved?: () => void }): ReactElement {
  const [value, setValue] = useState('');
  const markSaved = useUnsavedChanges(value !== '');
  return (
    <>
      <input
        aria-label='title'
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        type='button'
        onClick={() => {
          markSaved();
          onSaved?.();
        }}
      >
        save
      </button>
    </>
  );
}

function Dialog({
  onClose,
  dirty = false,
}: {
  readonly onClose: () => void;
  readonly dirty?: boolean;
}): ReactElement {
  const guard = useUnsavedChangesGuard(dirty);
  const close = useGuardedClose(guard, onClose);
  return (
    <Boundary guard={guard}>
      <Form onSaved={close} />
      <button type='button' onClick={close}>
        close
      </button>
    </Boundary>
  );
}

describe('unsaved changes guard', () => {
  it('closes at once when nothing was entered', async () => {
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} />);
    fireEvent.click(screen.getByText('close'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('asks while a form holds input, and keeps it when declined', async () => {
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('title'), {
      target: { value: 'x' },
    });
    fireEvent.click(screen.getByText('close'));
    fireEvent.click(await screen.findByText('keep'));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText('title')).toHaveValue('x');
  });

  it('closes when the person chooses to discard', async () => {
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('title'), {
      target: { value: 'x' },
    });
    fireEvent.click(screen.getByText('close'));
    fireEvent.click(await screen.findByText('discard'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('does not ask after the form marked its input saved', async () => {
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('title'), {
      target: { value: 'x' },
    });
    fireEvent.click(screen.getByText('save'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('counts the dirty flag a dialog passes itself', async () => {
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} dirty />);
    fireEvent.click(screen.getByText('close'));
    fireEvent.click(await screen.findByText('discard'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
