import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PendingButton } from '../../client/components/pending-button';
import { useSubmission } from '@nocobase/app-client';

function Editor({ operation }: { readonly operation: () => Promise<void> }) {
  const submission = useSubmission({ scope: 'pending-button-test' });
  return (
    <form
      aria-label='Editor'
      onSubmit={(event) => {
        event.preventDefault();
        void submission
          .run({ name: 'Draft' }, operation)
          .catch(() => undefined);
      }}
    >
      <input aria-label='Name' defaultValue='Draft' />
      <output data-testid='recoverable'>{String(submission.pending)}</output>
      <PendingButton
        type='submit'
        busy={submission.submitting}
        pendingLabel='Saving'
      >
        Save
      </PendingButton>
    </form>
  );
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
it('locks immediately, preserves native props/ref, announces once and clears on completion', () => {
  const ref = createRef<HTMLButtonElement>();
  const view = render(
    <PendingButton
      ref={ref}
      form='editor'
      type='submit'
      busy={false}
      pendingLabel='Saving changes'
    >
      Save
    </PendingButton>,
  );
  expect(ref.current).toBe(
    screen.getByRole('button', { name: 'Save', exact: true }),
  );
  view.rerender(
    <PendingButton
      ref={ref}
      form='editor'
      type='submit'
      busy
      pendingLabel='Saving changes'
    >
      Save
    </PendingButton>,
  );
  expect(ref.current).toBeDisabled();
  expect(ref.current).toHaveAttribute('aria-busy', 'true');
  expect(ref.current).toHaveAttribute('form', 'editor');
  expect(ref.current).toHaveAttribute('type', 'submit');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  act(() => vi.advanceTimersByTime(300));
  expect(screen.getAllByRole('status')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Saving changes' })).toBeDisabled();
  act(() => vi.advanceTimersByTime(9700));
  expect(screen.getByRole('status')).toHaveTextContent(
    'This is taking longer than usual',
  );
  view.rerender(
    <PendingButton busy={false} disabled pendingLabel='Saving changes'>
      Save
    </PendingButton>,
  );
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toBeDisabled();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('shares the submission lock across click and form submission, retains input on failure and permits retry', async () => {
  vi.useRealTimers();
  let reject!: (error: Error) => void;
  const operation = vi.fn(
    () =>
      new Promise<void>((_, fail) => {
        reject = fail;
      }),
  );
  render(<Editor operation={operation} />);
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
  fireEvent.submit(screen.getByRole('form', { name: 'Editor' }));
  expect(operation).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error('Rejected')));
  expect(screen.getByRole('textbox')).toHaveValue('Draft');
  expect(screen.getByTestId('recoverable')).toHaveTextContent('true');
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toBeEnabled();
  fireEvent.submit(screen.getByRole('form', { name: 'Editor' }));
  expect(operation).toHaveBeenCalledTimes(2);
  await act(async () => reject(new Error('Rejected again')));
});
