import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UnsavedChangesBoundary } from '../../client/components/unsaved-changes.js';
import {
  useGuardedClose,
  useUnsavedChanges,
  useUnsavedChangesGuard,
} from '@nocobase/app-client';
vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(cleanup);

function Form(): ReactElement {
  const [value, setValue] = useState('');
  useUnsavedChanges(value !== '');
  return (
    <input
      aria-label='title'
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

function Harness({ onClose }: { readonly onClose: () => void }): ReactElement {
  const guard = useUnsavedChangesGuard();
  const close = useGuardedClose(guard, onClose);
  return (
    <UnsavedChangesBoundary guard={guard}>
      <Form />
      <button type='button' onClick={close}>
        close
      </button>
    </UnsavedChangesBoundary>
  );
}

describe('unsaved changes guard', () => {
  it('closes at once when nothing was entered', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.click(screen.getByText('close'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('unsavedChanges.title')).toBeNull();
  });

  it('asks before discarding input and keeps editing when declined', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('title'), {
      target: { value: 'x' },
    });
    fireEvent.click(screen.getByText('close'));
    await screen.findByText('unsavedChanges.title');
    fireEvent.click(screen.getByText('unsavedChanges.keepEditing'));
    await waitFor(() =>
      expect(screen.queryByText('unsavedChanges.title')).toBeNull(),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes after the member chooses to discard', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('title'), {
      target: { value: 'x' },
    });
    fireEvent.click(screen.getByText('close'));
    fireEvent.click(await screen.findByText('unsavedChanges.discard'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('counts the dirty flag a dialog passes itself', async () => {
    const onClose = vi.fn();
    function Own(): ReactElement {
      const guard = useUnsavedChangesGuard(true);
      const close = useGuardedClose(guard, onClose);
      return (
        <UnsavedChangesBoundary guard={guard}>
          <button type='button' onClick={close}>
            close
          </button>
        </UnsavedChangesBoundary>
      );
    }
    render(<Own />);
    fireEvent.click(screen.getByText('close'));
    fireEvent.click(await screen.findByText('unsavedChanges.discard'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
