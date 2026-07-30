/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../hooks/useApp', () => ({
  useApp: () => ({
    router: {
      isSkippedAuthCheckRoute: () => false,
    },
  }),
}));

vi.mock('../settings-center/useSettingsSearch', () => ({
  useSettingsSearch: () => ({
    recentItems: [],
    search: vi.fn(() => []),
  }),
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

const platforms: Array<{
  acceptedModifier: KeyboardEventInit;
  label: string;
  name: string;
  platform: string;
  rejectedModifier: KeyboardEventInit;
}> = [
  {
    acceptedModifier: { metaKey: true },
    label: '⌘F',
    name: 'macOS',
    platform: 'MacIntel',
    rejectedModifier: { ctrlKey: true },
  },
  {
    acceptedModifier: { ctrlKey: true },
    label: 'Ctrl F',
    name: 'Windows',
    platform: 'Win32',
    rejectedModifier: { metaKey: true },
  },
];

async function renderSettingsSearch(platform: string) {
  Object.defineProperty(window.navigator, 'platform', {
    configurable: true,
    value: platform,
  });
  vi.resetModules();
  vi.doMock('react', () => ({ ...React, default: React }));
  vi.doMock('react-router-dom', () => ReactRouterDOM);

  const { SettingsSearch } = await import('../settings-app/SettingsSearch');
  return render(
    <ReactRouterDOM.MemoryRouter initialEntries={['/settings/system-settings']}>
      <SettingsSearch />
    </ReactRouterDOM.MemoryRouter>,
  );
}

function dispatchShortcut(
  init: KeyboardEventInit,
  options: {
    alreadyPrevented?: boolean;
  } = {},
) {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  if (options.alreadyPrevented) {
    event.preventDefault();
  }
  fireEvent(window, event);
  return event;
}

describe('SettingsSearch shortcut', () => {
  afterEach(() => {
    cleanup();
    vi.doUnmock('react');
    vi.doUnmock('react-router-dom');
    Reflect.deleteProperty(window.navigator, 'platform');
  });

  it.each(platforms)('displays $label on $name', async ({ label, platform }) => {
    await renderSettingsSearch(platform);

    expect(screen.getByTitle('Search settings')).toHaveTextContent(label);
  });

  it.each(platforms)(
    'opens only for the exact platform shortcut on $name',
    async ({ acceptedModifier, platform, rejectedModifier }) => {
      await renderSettingsSearch(platform);

      const rejectedShortcuts: Array<{
        name: string;
        init: KeyboardEventInit;
        alreadyPrevented?: boolean;
      }> = [
        { name: 'F without a modifier', init: { key: 'f' } },
        { name: 'the other platform modifier + F', init: { key: 'f', ...rejectedModifier } },
        { name: 'Ctrl+K', init: { key: 'k', ctrlKey: true } },
        { name: 'Meta+K', init: { key: 'k', metaKey: true } },
        { name: 'Alt with the platform shortcut', init: { key: 'f', ...acceptedModifier, altKey: true } },
        { name: 'Shift with the platform shortcut', init: { key: 'f', ...acceptedModifier, shiftKey: true } },
        { name: 'Ctrl+Meta+F', init: { key: 'f', ctrlKey: true, metaKey: true } },
        {
          name: 'an already handled platform shortcut',
          init: { key: 'f', ...acceptedModifier },
          alreadyPrevented: true,
        },
      ];

      for (const shortcut of rejectedShortcuts) {
        const event = dispatchShortcut(shortcut.init, { alreadyPrevented: shortcut.alreadyPrevented });
        expect(screen.queryByRole('dialog'), shortcut.name).not.toBeInTheDocument();
        expect(event.defaultPrevented, shortcut.name).toBe(shortcut.alreadyPrevented === true);
      }

      const repeatEvent = dispatchShortcut({ key: 'f', ...acceptedModifier, repeat: true });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(repeatEvent.defaultPrevented).toBe(true);

      const event = dispatchShortcut({ key: 'f', ...acceptedModifier });

      expect(event.defaultPrevented).toBe(true);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    },
  );
});
