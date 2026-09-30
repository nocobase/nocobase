import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  useCallback,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ConfirmDialog,
  type ConfirmDialogCloseReason,
  type ConfirmDialogProps,
  type ConfirmDialogResult,
} from '../../registry/components/confirm-dialog';
import { readmeTranslations } from '../readme-translations';

// Strict, with the keys the components README lists, as in data-table.test.tsx.
const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/ui-library',
    resources: readmeTranslations('components')['en-US'],
  },
});

function I18n({ children }: { readonly children: ReactNode }): ReactElement {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

interface Deferred {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
  readonly reject: (reason: unknown) => void;
}

function deferred(): Deferred {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

type HarnessProps = Pick<ConfirmDialogProps, 'onConfirm'> &
  Partial<Omit<ConfirmDialogProps, 'open' | 'onOpenChange' | 'onConfirm'>> & {
    readonly onClose?: (reason: ConfirmDialogCloseReason) => void;
    readonly withFocusTarget?: boolean;
  };

/** Opens the dialog from a button, the way a page does from a row's action, and keeps the open state itself. */
function Harness({
  onClose,
  withFocusTarget = false,
  ...props
}: HarnessProps): ReactElement {
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input aria-label='Search' ref={searchRef} />
      <button type='button' onClick={() => setOpen(true)}>
        Open
      </button>
      <ConfirmDialog
        title='Delete project "Apollo"?'
        description='This cannot be undone.'
        confirmLabel='Delete'
        {...props}
        open={open}
        onOpenChange={(next, reason) => {
          setOpen(next);
          onClose?.(reason);
        }}
        focusAfterConfirm={withFocusTarget ? searchRef : undefined}
      />
    </>
  );
}

function openDialog(): void {
  const opener = screen.getByRole('button', { name: 'Open' });
  opener.focus();
  fireEvent.click(opener);
}

function confirmButton(): HTMLElement {
  return screen.getByRole('button', { name: /Delete/ });
}

function pressEscape(): void {
  fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
}

function popup(): HTMLElement | null {
  return document.querySelector('[data-slot="alert-dialog-content"]');
}

let restoreAnimations: (() => void) | undefined;

/**
 * Gives every element a 100 ms animation, as the primitive's `duration-100` does in a browser, so the dialog stays
 * mounted while it animates closed. jsdom has no animations, which makes every close instant.
 */
function stubExitAnimation(): void {
  const original = Object.getOwnPropertyDescriptor(
    Element.prototype,
    'getAnimations',
  );
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    writable: true,
    value: () => [
      {
        finished: new Promise((resolve) => setTimeout(resolve, 100)),
        pending: false,
        playState: 'running',
      },
    ],
  });
  restoreAnimations = () => {
    if (original) {
      Object.defineProperty(Element.prototype, 'getAnimations', original);
    } else {
      Reflect.deleteProperty(Element.prototype, 'getAnimations');
    }
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  restoreAnimations?.();
  restoreAnimations = undefined;
});

describe('ConfirmDialog', () => {
  it('names the action and its consequence, and gives the cancel button the focus', async () => {
    render(<Harness onConfirm={vi.fn()} />, { wrapper: I18n });
    openDialog();

    const dialog = await screen.findByRole('alertdialog', {
      name: 'Delete project "Apollo"?',
    });
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
    expect(confirmButton()).toHaveTextContent('Delete');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus(),
    );
  });

  it('cancels with the cancel button or Escape, without running the action', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <Harness
        cancelLabel='Keep project'
        onClose={onClose}
        onConfirm={onConfirm}
      />,
      { wrapper: I18n },
    );

    openDialog();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Keep project' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );

    openDialog();
    await screen.findByRole('alertdialog');
    pressEscape();
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose.mock.calls).toEqual([['cancel'], ['cancel']]);
  });

  it('closes once a synchronous action returns', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} onConfirm={onConfirm} />, {
      wrapper: I18n,
    });
    openDialog();
    await screen.findByRole('alertdialog');

    fireEvent.click(confirmButton());

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledExactlyOnceWith('confirm');
  });

  it('shows the pending action, and cannot be closed or confirmed again until it settles', async () => {
    const action = deferred();
    const onConfirm = vi.fn(() => action.promise);
    const onClose = vi.fn();
    render(<Harness onClose={onClose} onConfirm={onConfirm} />, {
      wrapper: I18n,
    });
    openDialog();
    await screen.findByRole('alertdialog');

    fireEvent.click(confirmButton());

    // The spinner is the preview's shadcn copy, which names itself "Loading".
    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    // Disabled but focusable, so focus stays where the user left it.
    expect(confirmButton()).toHaveAttribute('aria-disabled', 'true');
    expect(confirmButton()).toHaveAttribute('data-disabled');

    fireEvent.click(confirmButton());
    pressEscape();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await act(async () => action.resolve());

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(onClose).toHaveBeenCalledExactlyOnceWith('confirm');
  });

  it('stays open with the default message when the action rejects, and can retry', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const onClose = vi.fn();
    const onConfirm = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('ECONNRESET at socket.js:42'))
      .mockResolvedValueOnce(undefined);
    render(<Harness onClose={onClose} onConfirm={onConfirm} />, {
      wrapper: I18n,
    });
    openDialog();
    await screen.findByRole('alertdialog');

    fireEvent.click(confirmButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The action failed. Please try again.',
    );
    expect(screen.queryByText(/ECONNRESET/)).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    expect(confirmButton()).not.toHaveAttribute('data-disabled');

    fireEvent.click(confirmButton());

    // Retrying clears the previous failure.
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(onConfirm).toHaveBeenCalledTimes(2);
    expect(onClose).toHaveBeenCalledExactlyOnceWith('confirm');
  });

  it('shows the failure the action reports, and disables confirming when a retry cannot help', async () => {
    render(
      <Harness
        onConfirm={() =>
          Promise.resolve({
            error: 'You do not have permission to delete this project.',
            retryable: false,
          })
        }
      />,
      { wrapper: I18n },
    );
    openDialog();
    await screen.findByRole('alertdialog');

    fireEvent.click(confirmButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You do not have permission to delete this project.',
    );
    expect(confirmButton()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });

  it('renders a failure node as given, so it can bring its own alert', async () => {
    render(
      <Harness
        onConfirm={() => ({
          error: (
            <div role='alert'>
              Your session has ended. <button type='button'>Sign in</button>
            </div>
          ),
          retryable: false,
        })}
      />,
      { wrapper: I18n },
    );
    openDialog();
    await screen.findByRole('alertdialog');

    fireEvent.click(confirmButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your session has ended.',
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('starts clean when it opens again after a failure', async () => {
    render(
      <Harness onConfirm={() => ({ error: 'The project is locked.' })} />,
      { wrapper: I18n },
    );
    openDialog();
    await screen.findByRole('alertdialog');
    fireEvent.click(confirmButton());
    await screen.findByRole('alert');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    openDialog();

    await screen.findByRole('alertdialog');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('sends focus to focusAfterConfirm after a confirm, and back to the opener after a cancel', async () => {
    render(<Harness onConfirm={vi.fn()} withFocusTarget />, {
      wrapper: I18n,
    });

    openDialog();
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus(),
    );

    openDialog();
    await screen.findByRole('alertdialog');
    fireEvent.click(confirmButton());
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus(),
    );
  });

  it('ignores an action that settles after the caller closed the dialog', async () => {
    const action = deferred();
    const onOpenChange = vi.fn();

    function ClosedByCaller(): ReactElement {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type='button' onClick={() => setOpen((value) => !value)}>
            Toggle
          </button>
          <ConfirmDialog
            open={open}
            onOpenChange={onOpenChange}
            title='Delete project "Apollo"?'
            confirmLabel='Delete'
            onConfirm={() => action.promise.then(() => ({ error: 'Late' }))}
          />
        </>
      );
    }

    render(<ClosedByCaller />, { wrapper: I18n });
    fireEvent.click(await screen.findByRole('button', { name: /Delete/ }));
    await screen.findByRole('status');

    // The page closes the dialog while the action runs. The dialog is modal, so its button is hidden until then.
    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle', hidden: true }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    await act(async () => action.resolve());
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

    // The late failure belongs to the earlier opening, so the new one starts clean.
    await screen.findByRole('alertdialog');
    expect(screen.queryByText('Late')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(confirmButton()).not.toHaveAttribute('data-disabled');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes through the latest onOpenChange, and stays busy through the closing animation', async () => {
    stubExitAnimation();
    const action = deferred();
    const seen: number[] = [];

    function Page(): ReactElement {
      const [open, setOpen] = useState(true);
      const [version, setVersion] = useState(0);
      return (
        <>
          <button type='button' onClick={() => setVersion((v) => v + 1)}>
            Re-render
          </button>
          <ConfirmDialog
            open={open}
            onOpenChange={(next) => {
              seen.push(version);
              setOpen(next);
            }}
            title='Delete project "Apollo"?'
            confirmLabel='Delete'
            onConfirm={() => action.promise}
          />
        </>
      );
    }

    render(<Page />, { wrapper: I18n });
    fireEvent.click(await screen.findByRole('button', { name: /Delete/ }));
    await screen.findByRole('status');
    // The page renders again while the action runs, handing the dialog a new onOpenChange.
    const rerender = screen.getByRole('button', {
      name: 'Re-render',
      hidden: true,
    });
    fireEvent.click(rerender);
    fireEvent.click(rerender);
    await act(async () => action.resolve());

    expect(seen).toEqual([2]);
    // Still animating closed: the spinner and the disabled buttons stay, so the action cannot run again.
    const closing = popup();
    expect(closing).toBeInTheDocument();
    expect(closing?.querySelector('[data-slot="spinner"]')).toBeInTheDocument();
    expect(
      closing?.querySelector('[data-slot="alert-dialog-cancel"]'),
    ).toBeDisabled();
    expect(
      closing?.querySelector('[data-slot="alert-dialog-action"]'),
    ).toHaveAttribute('aria-disabled', 'true');
    await waitFor(() => expect(popup()).not.toBeInTheDocument());
    expect(seen).toEqual([2]);
  });

  it('does not tell a caller whose close meant cancel to cancel, when confirming closed the dialog already', async () => {
    stubExitAnimation();
    // Shaped like a navigation guard: confirming accepts the held traversal, cancelling undoes it while one is held.
    const undone: string[] = [];

    function Guarded(): ReactElement {
      const [held, setHeld] = useState<string | null>('traversal');
      const confirm = useCallback(() => setHeld(null), []);
      const cancel = useCallback(() => {
        if (!held) return;
        undone.push(held);
        setHeld(null);
      }, [held]);
      return (
        <ConfirmDialog
          open={held !== null}
          title='Discard unsaved changes?'
          confirmLabel='Discard changes'
          onConfirm={confirm}
          onOpenChange={(open) => {
            if (!open) cancel();
          }}
        />
      );
    }

    render(<Guarded />, { wrapper: I18n });
    fireEvent.click(
      await screen.findByRole('button', { name: /Discard changes/ }),
    );
    await waitFor(() => expect(popup()).not.toBeInTheDocument());

    expect(undone).toEqual([]);
  });

  it('calls nothing once it has unmounted while the action runs', async () => {
    const action = deferred();
    const onOpenChange = vi.fn();
    const consoleError = vi.spyOn(console, 'error');
    const { unmount } = render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title='Delete project "Apollo"?'
        confirmLabel='Delete'
        onConfirm={() => action.promise}
      />,
      { wrapper: I18n },
    );
    fireEvent.click(await screen.findByRole('button', { name: /Delete/ }));
    await screen.findByRole('status');

    unmount();
    await act(async () => action.resolve());

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('runs the action once for two clicks handled in one batch', async () => {
    const onConfirm = vi.fn(() => deferred().promise);
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title='Delete project "Apollo"?'
        confirmLabel='Delete'
        onConfirm={onConfirm}
      />,
      { wrapper: I18n },
    );
    const button = await screen.findByRole('button', { name: /Delete/ });

    act(() => {
      button.click();
      button.click();
    });

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('moves focus to the confirm button while the action runs, where a failure leaves it', async () => {
    const action = deferred();
    render(
      <Harness
        onConfirm={() => action.promise.then(() => ({ error: 'Locked.' }))}
      />,
      { wrapper: I18n },
    );
    openDialog();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus(),
    );

    // A click that does not focus the button, as a mouse click in Safari does not, while Cancel is about to be disabled.
    fireEvent.click(confirmButton());

    expect(confirmButton()).toHaveFocus();
    await act(async () => action.resolve());
    expect(await screen.findByRole('alert')).toHaveTextContent('Locked.');
    expect(confirmButton()).toHaveFocus();
  });

  it('returns focus to the opener, not focusAfterConfirm, when a failure is followed by Cancel', async () => {
    render(
      <Harness onConfirm={() => ({ error: 'Locked.' })} withFocusTarget />,
      { wrapper: I18n },
    );
    openDialog();
    await screen.findByRole('alertdialog');
    fireEvent.click(confirmButton());
    await screen.findByRole('alert');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus(),
    );
  });

  it('leaves confirm enabled after a failure that does not set retryable, and shows the default message for an empty error', async () => {
    render(<Harness onConfirm={() => ({ error: '' })} />, { wrapper: I18n });
    openDialog();
    await screen.findByRole('alertdialog');

    fireEvent.click(confirmButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The action failed. Please try again.',
    );
    expect(confirmButton()).toHaveAttribute('aria-disabled', 'false');
    expect(confirmButton()).not.toHaveAttribute('data-disabled');
  });

  it('removes the previous failure while retrying', async () => {
    const retry = deferred();
    const onConfirm = vi
      .fn<() => ConfirmDialogResult | Promise<ConfirmDialogResult>>()
      .mockReturnValueOnce({ error: 'Locked.' })
      .mockReturnValueOnce(retry.promise);
    render(<Harness onConfirm={onConfirm} />, { wrapper: I18n });
    openDialog();
    await screen.findByRole('alertdialog');
    fireEvent.click(confirmButton());
    await screen.findByRole('alert');

    fireEvent.click(confirmButton());

    await screen.findByRole('status');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await act(async () => retry.resolve());
  });

  it('starts clean when the caller reopens it before a closing animation finishes', async () => {
    stubExitAnimation();
    const action = deferred();

    function Page(): ReactElement {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type='button' onClick={() => setOpen((value) => !value)}>
            Toggle
          </button>
          <ConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title='Delete project "Apollo"?'
            confirmLabel='Delete'
            onConfirm={() => action.promise.then(() => ({ error: 'Late' }))}
          />
        </>
      );
    }

    render(<Page />, { wrapper: I18n });
    fireEvent.click(await screen.findByRole('button', { name: /Delete/ }));
    await screen.findByRole('status');
    const toggle = screen.getByRole('button', { name: 'Toggle', hidden: true });
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    await act(async () => action.resolve());

    expect(screen.queryByText('Late')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(confirmButton()).not.toHaveAttribute('data-disabled');
  });
});
