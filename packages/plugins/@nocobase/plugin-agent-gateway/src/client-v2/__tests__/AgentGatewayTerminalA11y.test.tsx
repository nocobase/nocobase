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
import { afterEach, describe, expect, it, vi } from 'vitest';

import ReadonlyXtermOutput from '../components/ReadonlyXtermOutput';

const xtermMock = vi.hoisted(() => {
  type KeyHandler = (event: KeyboardEvent) => boolean;

  class MockTerminal {
    static instances: MockTerminal[] = [];

    keyHandler?: KeyHandler;

    constructor(readonly options: Record<string, unknown>) {
      MockTerminal.instances.push(this);
    }

    loadAddon() {}
    open() {}
    write() {}
    reset() {}
    dispose() {}

    attachCustomKeyEventHandler(handler: KeyHandler) {
      this.keyHandler = handler;
    }
  }

  return { MockTerminal };
});

vi.mock('@xterm/xterm', () => ({
  Terminal: xtermMock.MockTerminal,
}));

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: class MockFitAddon {
    fit() {}
  },
}));

describe('Agent Gateway terminal accessibility', () => {
  afterEach(() => {
    cleanup();
    xtermMock.MockTerminal.instances = [];
    vi.restoreAllMocks();
  });

  it('exposes a named readonly terminal region without raw input controls', async () => {
    render(
      <ReadonlyXtermOutput
        ariaLabel="Readonly live terminal output"
        chunks={[]}
        emptyText="No terminal output yet"
        initialOutput="agent output"
        resetKey="run-1:snapshot"
      />,
    );

    expect(screen.getByRole('region', { name: 'Readonly live terminal output' })).toBeTruthy();
    expect(screen.queryByLabelText('Terminal input')).toBeNull();
    expect(screen.queryByLabelText('Send terminal input')).toBeNull();
    await waitFor(() => {
      expect(xtermMock.MockTerminal.instances[0].options.disableStdin).toBe(true);
      expect(xtermMock.MockTerminal.instances[0].keyHandler).toBeTruthy();
    });
    expect(xtermMock.MockTerminal.instances[0].keyHandler?.(new KeyboardEvent('keydown', { key: 'A' }))).toBe(false);
  });
});
