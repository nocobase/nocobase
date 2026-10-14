import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LongText, LongTextPreview } from '../../registry/components/long-text';

// jsdom lays nothing out: the observer reports at once, and every element is as tall as `overflowing` says.
let overflowing = false;

beforeEach(() => {
  overflowing = false;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(): void {
        this.callback([], this as unknown as ResizeObserver);
      }
      disconnect(): void {}
    },
  );
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
    () => (overflowing ? 200 : 60),
  );
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(60);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const TEXT = 'A first line.\nA second line.';

describe('LongText', () => {
  it('leaves a text that fits alone: no fade, no pointer, nothing to unfold', () => {
    const { container } = render(<LongText>{TEXT}</LongText>);
    const text = container.firstElementChild as HTMLElement;
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(text.className).not.toContain('mask-image');
    expect(text).not.toHaveAttribute('aria-expanded');
    expect(text).toHaveStyle({ '--long-text-lines': '5' });
  });

  it('fades an overflowing text and unfolds it in place on a click, folding it on the next', () => {
    vi.useFakeTimers();
    overflowing = true;
    render(<LongText lines={3}>{TEXT}</LongText>);
    const text = screen.getByRole('button');
    expect(text).toHaveAttribute('aria-expanded', 'false');
    expect(text.className).toContain('mask-image');
    expect(text).toHaveStyle({ '--long-text-lines': '3' });
    fireEvent.click(text, { detail: 1 });
    act(() => vi.advanceTimersByTime(220));
    expect(text).toHaveAttribute('aria-expanded', 'true');
    expect(text.className).not.toContain('max-h-');
    fireEvent.click(text, { detail: 1 });
    act(() => vi.advanceTimersByTime(220));
    expect(text).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not fold on a double-click, which selects a word', () => {
    vi.useFakeTimers();
    overflowing = true;
    render(<LongText>{TEXT}</LongText>);
    const text = screen.getByRole('button');
    fireEvent.click(text, { detail: 1 });
    fireEvent.click(text, { detail: 2 });
    fireEvent.doubleClick(text);
    act(() => vi.advanceTimersByTime(220));
    expect(text).toHaveAttribute('aria-expanded', 'false');
  });

  it('unfolds with Enter or Space', () => {
    overflowing = true;
    render(<LongText>{TEXT}</LongText>);
    const text = screen.getByRole('button');
    fireEvent.keyDown(text, { key: 'Enter' });
    expect(text).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(text, { key: ' ' });
    expect(text).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('LongTextPreview', () => {
  it('shows a text that fits as it is, with no pop-up to open', () => {
    render(<LongTextPreview label='Note'>Key account.</LongTextPreview>);
    expect(screen.getByText('Key account.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('opens an overflowing text whole in a pop-up headed by its label', async () => {
    overflowing = true;
    const user = userEvent.setup();
    render(<LongTextPreview label='Introduction'>{TEXT}</LongTextPreview>);
    const trigger = screen.getByRole('button');
    expect(trigger.firstElementChild?.className).toContain('mask-image');
    await user.click(trigger);
    const popup = await screen.findByRole('dialog');
    expect(popup).toHaveTextContent('Introduction');
    expect(popup).toHaveTextContent('A first line.');
    expect(popup).toHaveTextContent('A second line.');
  });
});
