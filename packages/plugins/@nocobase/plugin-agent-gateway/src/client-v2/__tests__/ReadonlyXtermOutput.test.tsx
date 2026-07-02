/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ReadonlyXtermOutput from '../components/ReadonlyXtermOutput';
import { TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME } from '../../shared/terminalStreamProtocol';

const MAX_TEST_VISIBLE_BYTES = Math.min(4 * 1024, TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME);

const xtermMock = vi.hoisted(() => {
  type KeyHandler = (event: KeyboardEvent) => boolean;

  class MockTerminal {
    static instances: MockTerminal[] = [];
    static deferWriteCallbacks = false;
    static deferredWriteCallbacks: (() => void)[] = [];

    writes: string[] = [];
    committedText = '';
    resetCount = 0;
    disposed = false;
    keyHandler?: KeyHandler;
    options: Record<string, unknown>;

    constructor(options: Record<string, unknown>) {
      this.options = options;
      MockTerminal.instances.push(this);
    }

    loadAddon() {}

    attachCustomKeyEventHandler(handler: KeyHandler) {
      this.keyHandler = handler;
    }

    open() {}

    write(value: string, callback?: () => void) {
      this.writes.push(value);
      const commit = () => {
        this.committedText += value;
        callback?.();
      };
      if (MockTerminal.deferWriteCallbacks) {
        MockTerminal.deferredWriteCallbacks.push(commit);
        return;
      }
      commit();
    }

    reset() {
      this.resetCount += 1;
      this.committedText = '';
    }

    dispose() {
      this.disposed = true;
    }
  }

  return {
    MockTerminal,
  };
});

const fitAddonMock = vi.hoisted(() => {
  class MockFitAddon {
    static instances: MockFitAddon[] = [];

    fit = vi.fn();

    constructor() {
      MockFitAddon.instances.push(this);
    }
  }

  return {
    MockFitAddon,
  };
});

vi.mock('@xterm/xterm', () => ({
  Terminal: xtermMock.MockTerminal,
}));

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: fitAddonMock.MockFitAddon,
}));

describe('ReadonlyXtermOutput', () => {
  beforeEach(() => {
    xtermMock.MockTerminal.instances = [];
    xtermMock.MockTerminal.deferWriteCallbacks = false;
    xtermMock.MockTerminal.deferredWriteCallbacks = [];
    fitAddonMock.MockFitAddon.instances = [];
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: class MockResizeObserver {
        observe() {}
        disconnect() {}
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders an accessible readonly xterm region with the initial output', async () => {
    render(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput="snapshot output"
        resetKey="run-1:snapshot"
      />,
    );

    expect(screen.getByRole('region', { name: 'Readonly live terminal output' })).toBeTruthy();
    expect(screen.getByTestId('agent-gateway-readonly-xterm')).toBeTruthy();
    await waitFor(() => {
      expect(xtermMock.MockTerminal.instances[0].writes).toContain('snapshot output');
    });
    expect(xtermMock.MockTerminal.instances[0].options.disableStdin).toBe(true);
  });

  it('compacts snapshot trailing blank lines but writes live chunks verbatim', async () => {
    const { rerender } = render(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput={'running command\n\n\n\n\n'}
        resetKey="run-1:snapshot"
      />,
    );
    const terminal = xtermMock.MockTerminal.instances[0];

    await waitFor(() => {
      expect(terminal.writes).toContain('running command\n\n');
    });

    rerender(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[
          {
            frameType: 'terminal.snapshot',
            offsetStart: 0,
            offsetEnd: 18,
            sequence: 1,
            text: 'live command\n\n\n',
          },
        ]}
        emptyText="No terminal output yet"
        initialOutput=""
        resetKey="run-1:stream"
      />,
    );

    await waitFor(() => {
      expect(terminal.writes).toContain('live command\n\n\n');
    });
  });

  it('writes new stream chunks once by sequence and disposes xterm on unmount', async () => {
    const { rerender, unmount } = render(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput=""
        resetKey="run-1:stream"
      />,
    );
    const terminal = xtermMock.MockTerminal.instances[0];
    expect(terminal.writes).not.toContain('No terminal output yet');

    rerender(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[
          {
            frameType: 'terminal.data',
            offsetStart: 0,
            offsetEnd: 6,
            sequence: 1,
            text: 'hello\n',
          },
        ]}
        emptyText="No terminal output yet"
        initialOutput=""
        resetKey="run-1:stream"
      />,
    );

    await waitFor(() => {
      expect(terminal.writes.filter((value) => value === 'hello\n')).toHaveLength(1);
    });
    rerender(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[
          {
            frameType: 'terminal.data',
            offsetStart: 0,
            offsetEnd: 6,
            sequence: 1,
            text: 'hello\n',
          },
          {
            frameType: 'terminal.data',
            offsetStart: 6,
            offsetEnd: 12,
            sequence: 2,
            text: 'world\n',
          },
        ]}
        emptyText="No terminal output yet"
        initialOutput=""
        resetKey="run-1:stream"
      />,
    );

    await waitFor(() => {
      expect(terminal.writes.filter((value) => value === 'hello\n')).toHaveLength(1);
      expect(terminal.writes).toContain('world\n');
    });
    rerender(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[
          {
            frameType: 'terminal.data',
            offsetStart: 12,
            offsetEnd: 18,
            sequence: 3,
            text: 'again\n',
          },
        ]}
        emptyText="No terminal output yet"
        initialOutput=""
        resetKey="run-1:stream"
      />,
    );

    await waitFor(() => {
      expect(terminal.writes).toContain('again\n');
    });
    expect(terminal.writes.filter((value) => value === 'hello\n')).toHaveLength(1);
    unmount();
    expect(terminal.disposed).toBe(true);
  });

  it('limits each xterm write flush to the browser frame byte budget', async () => {
    vi.useFakeTimers();
    const largeOutput = `${'L'.repeat(TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME)}tail`;
    render(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput={largeOutput}
        resetKey="run-1:snapshot"
      />,
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const terminal = xtermMock.MockTerminal.instances[0];
    expect(terminal.writes.length).toBeGreaterThan(2);
    expect(terminal.writes.join('')).toBe(largeOutput.slice(-MAX_TEST_VISIBLE_BYTES));
    expect(Math.max(...terminal.writes.map((value) => value.length))).toBeLessThanOrEqual(
      TERMINAL_BROWSER_MAX_DECODED_PAYLOAD_BYTES_PER_FRAME,
    );
  });

  it('flushes the latest reset output when reset happens before a pending frame', async () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput="old snapshot"
        resetKey="run-1:old"
      />,
    );
    const terminal = xtermMock.MockTerminal.instances[0];

    rerender(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput="new snapshot"
        resetKey="run-1:new"
      />,
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(terminal.writes).toEqual(['new snapshot']);
  });

  it('waits for an in-flight xterm write before applying reset output', async () => {
    vi.useFakeTimers();
    xtermMock.MockTerminal.deferWriteCallbacks = true;
    const { rerender } = render(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput="old snapshot"
        resetKey="run-1:old"
      />,
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    const terminal = xtermMock.MockTerminal.instances[0];
    expect(terminal.writes).toEqual(['old snapshot']);
    expect(terminal.committedText).toBe('');

    rerender(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput="new snapshot"
        resetKey="run-1:new"
      />,
    );
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(terminal.writes).toEqual(['old snapshot']);

    xtermMock.MockTerminal.deferWriteCallbacks = false;
    const [commitOldWrite] = xtermMock.MockTerminal.deferredWriteCallbacks.splice(0);
    act(() => {
      commitOldWrite();
    });
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(terminal.writes[0]).toBe('old snapshot');
    expect(terminal.writes.at(-1)).toBe('new snapshot');
    expect(terminal.committedText).toBe('new snapshot');
  });

  it('applies pending reset when an in-flight xterm write callback never arrives', async () => {
    vi.useFakeTimers();
    xtermMock.MockTerminal.deferWriteCallbacks = true;
    const { rerender } = render(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput="old snapshot"
        resetKey="run-1:old"
      />,
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    const terminal = xtermMock.MockTerminal.instances[0];
    const resetCountBefore = terminal.resetCount;
    expect(terminal.writes).toEqual(['old snapshot']);

    rerender(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput="new snapshot"
        resetKey="run-1:new"
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(terminal.resetCount).toBeGreaterThan(resetCountBefore);
    expect(terminal.writes[0]).toBe('old snapshot');
    expect(terminal.writes.at(-1)).toBe('new snapshot');
  });

  it('does not replay an older fallback reset after a newer reset has applied', async () => {
    vi.useFakeTimers();
    xtermMock.MockTerminal.deferWriteCallbacks = true;
    const { rerender } = render(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput="snapshot A"
        resetKey="run-1:a"
      />,
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    const terminal = xtermMock.MockTerminal.instances[0];
    expect(terminal.writes).toEqual(['snapshot A']);

    rerender(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput="snapshot B"
        resetKey="run-1:b"
      />,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(terminal.writes.at(-1)).toBe('snapshot B');

    xtermMock.MockTerminal.deferWriteCallbacks = false;
    rerender(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput="snapshot C"
        resetKey="run-1:c"
      />,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(terminal.committedText).toBe('snapshot C');

    const [commitOldWrite] = xtermMock.MockTerminal.deferredWriteCallbacks.splice(0);
    act(() => {
      commitOldWrite();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(terminal.committedText).toBe('snapshot C');
    expect(terminal.writes.at(-1)).toBe('snapshot C');
  });

  it('replays a newer reset when a timed-out write had no pending reset at fallback time', async () => {
    vi.useFakeTimers();
    xtermMock.MockTerminal.deferWriteCallbacks = true;
    const { rerender } = render(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[
          {
            frameType: 'terminal.data',
            offsetStart: 0,
            offsetEnd: 11,
            sequence: 1,
            text: 'stale live\n',
          },
        ]}
        emptyText="No terminal output yet"
        initialOutput=""
        resetKey="run-1:stream"
      />,
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    const terminal = xtermMock.MockTerminal.instances[0];
    expect(terminal.writes).toContain('stale live\n');
    expect(terminal.committedText).toBe('');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    xtermMock.MockTerminal.deferWriteCallbacks = false;
    rerender(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput="snapshot C"
        resetKey="run-1:c"
      />,
    );
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(terminal.committedText).toBe('snapshot C');

    const [commitStaleWrite] = xtermMock.MockTerminal.deferredWriteCallbacks.splice(0);
    act(() => {
      commitStaleWrite();
    });
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(terminal.committedText).toBe('snapshot C');
    expect(terminal.writes.at(-1)).toBe('snapshot C');
  });

  it('keeps a newer reset write guarded when an older timed-out write callback arrives', async () => {
    vi.useFakeTimers();
    xtermMock.MockTerminal.deferWriteCallbacks = true;
    const { rerender } = render(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[
          {
            frameType: 'terminal.data',
            offsetStart: 0,
            offsetEnd: 11,
            sequence: 1,
            text: 'stale live\n',
          },
        ]}
        emptyText="No terminal output yet"
        initialOutput=""
        resetKey="run-1:stream"
      />,
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    const terminal = xtermMock.MockTerminal.instances[0];
    expect(terminal.writes).toContain('stale live\n');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    rerender(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput="snapshot C"
        resetKey="run-1:c"
      />,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20);
    });
    expect(terminal.writes.at(-1)).toBe('snapshot C');

    const [commitStaleWrite, commitInFlightResetWrite] = xtermMock.MockTerminal.deferredWriteCallbacks.splice(0, 2);
    act(() => {
      commitStaleWrite();
    });
    expect(terminal.committedText).toBe('stale live\n');

    xtermMock.MockTerminal.deferWriteCallbacks = false;
    act(() => {
      commitInFlightResetWrite();
    });
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(terminal.committedText).toBe('snapshot C');
    expect(terminal.writes.at(-1)).toBe('snapshot C');
  });

  it('continues flushing live chunks when an xterm write callback stalls', async () => {
    vi.useFakeTimers();
    xtermMock.MockTerminal.deferWriteCallbacks = true;
    const { rerender } = render(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[
          {
            frameType: 'terminal.data',
            offsetStart: 0,
            offsetEnd: 6,
            sequence: 1,
            text: 'first\n',
          },
        ]}
        emptyText="No terminal output yet"
        initialOutput=""
        resetKey="run-1:stream"
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    const terminal = xtermMock.MockTerminal.instances[0];
    expect(terminal.writes).toContain('first\n');

    rerender(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[
          {
            frameType: 'terminal.data',
            offsetStart: 0,
            offsetEnd: 6,
            sequence: 1,
            text: 'first\n',
          },
          {
            frameType: 'terminal.data',
            offsetStart: 6,
            offsetEnd: 13,
            sequence: 2,
            text: 'second\n',
          },
        ]}
        emptyText="No terminal output yet"
        initialOutput=""
        resetKey="run-1:stream"
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(terminal.writes.filter((value) => value === 'first\n')).toHaveLength(1);
    expect(terminal.writes.filter((value) => value === 'second\n')).toHaveLength(1);

    xtermMock.MockTerminal.deferWriteCallbacks = false;
    const deferredCallbacks = xtermMock.MockTerminal.deferredWriteCallbacks.splice(0);
    act(() => {
      for (const callback of deferredCallbacks) {
        callback();
      }
    });

    expect(terminal.writes.filter((value) => value === 'second\n')).toHaveLength(1);
  });

  it('blocks normal key input while allowing copy shortcuts', async () => {
    render(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput=""
        resetKey="run-1:stream"
      />,
    );

    await waitFor(() => {
      expect(xtermMock.MockTerminal.instances[0].keyHandler).toBeTruthy();
    });
    const handler = xtermMock.MockTerminal.instances[0].keyHandler;
    expect(handler?.(new KeyboardEvent('keydown', { key: 'A' }))).toBe(false);
    expect(handler?.(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true }))).toBe(true);
  });
});
