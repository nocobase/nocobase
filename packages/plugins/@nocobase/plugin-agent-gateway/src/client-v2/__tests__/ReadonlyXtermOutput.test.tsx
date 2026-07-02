/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ReadonlyXtermOutput from '../components/ReadonlyXtermOutput';

const xtermMock = vi.hoisted(() => {
  type KeyHandler = (event: KeyboardEvent) => boolean;

  class MockTerminal {
    static instances: MockTerminal[] = [];

    writes: string[] = [];
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

    write(value: string) {
      this.writes.push(value);
    }

    reset() {
      this.resetCount += 1;
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
