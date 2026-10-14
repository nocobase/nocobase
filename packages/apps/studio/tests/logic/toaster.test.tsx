import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createToastManager, Toaster } from '@/components/ui/toast';
import { createToaster } from '@/lib/toaster';

describe('application toaster', () => {
  it('forwards what a toast reports to the Base UI toast manager', () => {
    const manager = createToastManager();
    const add = vi.spyOn(manager, 'add');
    const close = vi.spyOn(manager, 'close');
    const onClose = vi.fn();
    const toaster = createToaster(manager);

    const id = toaster.show({
      id: 'saved',
      type: 'success',
      title: 'Saved',
      description: 'All changes are stored.',
      duration: 4000,
      onClose,
    });
    toaster.close(id);

    expect(id).toBe('saved');
    expect(add).toHaveBeenCalledWith({
      id: 'saved',
      type: 'success',
      title: 'Saved',
      description: 'All changes are stored.',
      timeout: 4000,
      priority: 'low',
      onClose,
    });
    expect(close).toHaveBeenCalledWith('saved');
    expect(toaster.show({ title: 'Saved again' })).toEqual(expect.any(String));
  });

  it('renders an action as a button that leaves the toast open', async () => {
    const manager = createToastManager();
    const onClick = vi.fn();
    render(<Toaster toastManager={manager} />);

    act(() => {
      createToaster(manager).show({
        type: 'info',
        title: 'Archived',
        action: { label: 'Undo', onClick },
      });
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('closes one toast, never all of them', () => {
    const manager = createToastManager();
    const close = vi.spyOn(manager, 'close');

    // A JavaScript caller can pass no id, which Base UI would take as "close every toast".
    createToaster(manager).close(undefined as unknown as string);

    expect(close).not.toHaveBeenCalled();
  });

  it('announces a plain-text error at once and keeps every other toast at the default priority', () => {
    const manager = createToastManager();
    const add = vi.spyOn(manager, 'add');
    const toaster = createToaster(manager);

    toaster.show({
      type: 'error',
      title: 'Unable to save',
      description: 'The server is unavailable.',
    });
    toaster.show({
      type: 'error',
      title: 'Unable to deploy',
      description: <button type='button'>Show technical details</button>,
    });
    toaster.show({
      type: 'error',
      title: 'Unable to save',
      action: { label: 'Retry', onClick: vi.fn() },
    });
    toaster.show({ type: 'success', title: 'Saved' });

    expect(add.mock.calls.map(([options]) => options.priority)).toEqual([
      'high',
      'low',
      'low',
      'low',
    ]);
  });

  it('shows what it forwards in the Toaster mounted with its defaults', async () => {
    // Both defaults are the module's toast manager: that shared manager is what connects the registered toaster to the
    // Toaster that client/react-providers.ts mounts.
    render(<Toaster />);

    act(() => {
      createToaster().show({ type: 'success', title: 'Connected' });
    });

    expect(await screen.findByText('Connected')).toBeInTheDocument();
  });
});
