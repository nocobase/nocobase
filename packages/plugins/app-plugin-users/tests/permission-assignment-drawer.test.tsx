// @vitest-environment jsdom
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import type {
  ManagedUser,
  UserRoleScopeOption,
} from '../client/user-client.js';
import { PermissionAssignmentDrawer } from '../client/components/permission-assignment-drawer.js';
import enUS from '../client/locales/en-US.js';

// Rendered without a namespace scope, so the strict runtime only finds the keys if the drawer names its namespace.
const runtime = await createTestI18nRuntime({
  namespaces: { '@nocobase/app-plugin-users': enUS },
});
function I18n({ children }: { readonly children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}
afterEach(cleanup);
const user = {
  name: 'Alice',
  email: 'alice@example.test',
  roleScopes: { app: ['member', 'root'] },
} as unknown as ManagedUser;
const scope: UserRoleScopeOption = {
  key: 'app',
  label: 'Permission sets',
  selection: 'multiple',
  requiredOnCreate: false,
  options: [
    { value: 'member', label: 'Member' },
    { value: 'export', label: 'Exporter' },
    { value: 'root', label: 'Root', removable: false, assignable: false },
  ],
};
it('keeps selections local until saved and preserves protected grants', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <PermissionAssignmentDrawer
      user={user}
      scope={scope}
      onClose={vi.fn()}
      onSave={save}
    />,
    { wrapper: I18n },
  );
  const interaction = userEvent.setup();
  await interaction.type(screen.getByRole('textbox'), 'Exporter');
  await interaction.click(screen.getByRole('checkbox', { name: 'Exporter' }));
  expect(save).not.toHaveBeenCalled();
  await interaction.clear(screen.getByRole('textbox'));
  expect(
    (
      screen.getByRole('checkbox', { name: /Root/ }) as HTMLInputElement
    ).getAttribute('aria-disabled') === 'true' ||
      screen.getByRole('checkbox', { name: /Root/ }).hasAttribute('disabled'),
  ).toBe(true);
  await interaction.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(['member', 'root', 'export']),
  );
});
it('keeps the draft after a failed save and requires explicit discard', async () => {
  const close = vi.fn();
  render(
    <PermissionAssignmentDrawer
      user={user}
      scope={scope}
      onClose={close}
      onSave={vi.fn().mockRejectedValue(new Error('failed'))}
    />,
    { wrapper: I18n },
  );
  const interaction = userEvent.setup();
  await interaction.click(screen.getByRole('checkbox', { name: 'Exporter' }));
  await interaction.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toBeDefined();
  expect(
    screen
      .getByRole('checkbox', { name: 'Exporter' })
      .getAttribute('aria-checked'),
  ).toBe('true');
  await interaction.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(close).not.toHaveBeenCalled();
  await interaction.click(
    screen.getByRole('button', { name: 'Discard changes' }),
  );
  expect(close).toHaveBeenCalledOnce();
});
