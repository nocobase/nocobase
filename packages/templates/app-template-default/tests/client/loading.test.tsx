import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Loading } from '../../client/components/loading';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
describe('Loading', () => {
  it('marks the region busy immediately, then announces once after 300ms', () => {
    const view = render(<Loading label='Loading page' />);
    expect(
      view.container.querySelector('[data-slot="loading"]'),
    ).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(300));
    expect(
      screen.getByRole('status', { name: 'Loading page' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    view.rerender(<Loading pending={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('keeps the startup container while delayed, without adding a region height by default', () => {
    const view = render(<Loading fullscreen />);
    expect(view.container.querySelector('[data-slot="loading"]')).toHaveClass(
      'min-h-svh',
      'w-full',
      'bg-background',
    );
    view.rerender(<Loading />);
    expect(
      view.container.querySelector('[data-slot="loading"]'),
    ).not.toHaveClass('min-h-svh');
  });
});
