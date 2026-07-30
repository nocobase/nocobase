/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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
      <button type="button">Outside control</button>
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

  it.each([
    { activation: 'click', key: null },
    { activation: 'Enter', key: 'Enter' },
    { activation: 'Space', key: ' ' },
  ])('closes immediately with Escape after opening by $activation', async ({ key }) => {
    await renderSettingsSearch('MacIntel');

    const outsideControl = screen.getByRole('button', { name: 'Outside control' });
    const trigger = screen.getByTitle('Search settings');
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    if (key) {
      trigger.focus();
      fireEvent.keyDown(trigger, { key });
      expect(trigger).toHaveFocus();
      fireEvent(document.activeElement as Element, event);
    } else {
      outsideControl.focus();
      trigger.focus();
      fireEvent.click(trigger);
      expect(trigger).toHaveFocus();
      fireEvent(document.activeElement as Element, event);
    }

    expect(event.defaultPrevented).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    const closedEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    fireEvent(trigger, closedEvent);
    expect(closedEvent.defaultPrevented).toBe(false);
  });

  it('moves focus to the trigger before opening from the platform shortcut', async () => {
    await renderSettingsSearch('MacIntel');

    const outsideControl = screen.getByRole('button', { name: 'Outside control' });
    const trigger = screen.getByTitle('Search settings');
    outsideControl.focus();

    const shortcutEvent = new KeyboardEvent('keydown', {
      key: 'f',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(outsideControl, shortcutEvent);

    expect(shortcutEvent.defaultPrevented).toBe(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(trigger).toHaveFocus();

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    fireEvent(document.activeElement as Element, escapeEvent);
    expect(escapeEvent.defaultPrevented).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(outsideControl).toHaveFocus();
  });

  it('keeps immediate Escape from reaching a lower overlay', async () => {
    await renderSettingsSearch('MacIntel');

    const trigger = screen.getByTitle('Search settings');
    fireEvent.click(trigger);
    const lowerOverlayKeyDown = vi.fn();
    window.addEventListener('keydown', lowerOverlayKeyDown);

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    fireEvent(trigger, event);
    window.removeEventListener('keydown', lowerOverlayKeyDown);

    expect(lowerOverlayKeyDown).not.toHaveBeenCalled();
  });

  it('closes from the dialog Escape path and restores the original focus', async () => {
    await renderSettingsSearch('MacIntel');

    const outsideControl = screen.getByRole('button', { name: 'Outside control' });
    outsideControl.focus();
    dispatchShortcut({ key: 'f', metaKey: true });
    const input = screen.getByPlaceholderText('Search settings');
    act(() => input.focus());
    expect(input).toHaveFocus();

    fireEvent.keyDown(input, { key: 'Escape', keyCode: 27 });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(outsideControl).toHaveFocus();
  });

  it('keeps focus inside the dialog when the platform shortcut is pressed again', async () => {
    await renderSettingsSearch('MacIntel');

    dispatchShortcut({ key: 'f', metaKey: true });
    const input = screen.getByPlaceholderText('Search settings');
    act(() => input.focus());
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: 'portal' } });

    const shortcutEvent = new KeyboardEvent('keydown', {
      key: 'f',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(input, shortcutEvent);

    expect(shortcutEvent.defaultPrevented).toBe(true);
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });
});
