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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { closeUserMenu, closeTopbar, settings } = vi.hoisted(() => ({
  closeUserMenu: vi.fn(),
  closeTopbar: vi.fn(),
  settings: { available: true },
}));

vi.mock('@formily/react', () => ({
  useField: vi.fn(),
  useFieldSchema: vi.fn(),
  useForm: vi.fn(),
}));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (value: string) => value }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

vi.mock('@nocobase/client', async () => {
  const { createContext } = await import('react');
  const Wrapper = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  return {
    ActionContextProvider: Wrapper,
    DropdownVisibleContext: createContext<{ visible: boolean; setVisible: (visible: boolean) => void } | null>(null),
    ExtendCollectionsProvider: Wrapper,
    RemoteSchemaComponent: () => null,
    SchemaComponent: () => <div role="dialog">Profile form</div>,
    SchemaSettingsItem: Wrapper,
    SchemaComponentContext: createContext({}),
    zIndexContext: createContext(100),
    useZIndexContext: () => 100,
    useSchemaSettings: () => (settings.available ? { setVisible: closeUserMenu } : undefined),
    useSystemSettings: () => ({ data: { data: {} } }),
  };
});

import { DropdownVisibleContext } from '@nocobase/client';
import { ChangePassword } from '../ChangePassword';
import { EditProfile } from '../EditProfile';

beforeEach(() => {
  closeUserMenu.mockClear();
  closeTopbar.mockClear();
  settings.available = true;
});
afterEach(cleanup);

describe.each([
  { title: 'Edit profile', Component: EditProfile },
  { title: 'Change password', Component: ChangePassword },
])('$title popup', ({ title, Component }) => {
  it('closes both mobile menus while opening the form', () => {
    render(
      <DropdownVisibleContext.Provider value={{ visible: true, setVisible: closeTopbar }}>
        <Component />
      </DropdownVisibleContext.Provider>,
    );

    fireEvent.click(screen.getByText(title));

    expect(closeUserMenu).toHaveBeenCalledWith(false);
    expect(closeTopbar).toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('closes the desktop user menu without a mobile provider', () => {
    render(<Component />);

    fireEvent.click(screen.getByText(title));

    expect(closeUserMenu).toHaveBeenCalledWith(false);
    expect(closeTopbar).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('still opens outside a schema settings menu', () => {
    settings.available = false;
    render(<Component />);

    fireEvent.click(screen.getByText(title));

    expect(screen.getByRole('dialog')).toBeVisible();
  });
});
