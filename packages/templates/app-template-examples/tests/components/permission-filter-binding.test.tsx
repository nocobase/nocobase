import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import type {
  AuthorizationOptionsResponse,
  PermissionGrant,
} from '@nocobase/app-plugin-authorization/client';
import { PermissionEditor } from '../../client/components/permission-editor.js';
import { configurePermissionScopes } from '../../client/pages/settings/permission-filters.js';
import {
  permissionSections,
  setScope,
} from '../../client/pages/settings/permissions-model.js';
import enUS from '../../client/locales/en-US.js';
const catalog = {
  sections: [
    {
      name: 'business',
      title: 'Business',
      subsections: [
        {
          name: 'expenses',
          title: 'Expenses',
          resources: [
            {
              type: 'composite',
              id: 'expenses.records',
              title: 'Expenses',
              actions: [{ name: 'view', title: 'View' }],
              dataScopes: {
                view: [
                  {
                    key: 'records',
                    title: 'Records',
                    collection: 'expenses',
                    fields: ['department'],
                    recordAccess: ['recordsIOwn', 'customFilter'],
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  recordAccess: [
    { key: 'recordsIOwn', title: 'Own', collections: ['expenses'] },
    { key: 'customFilter', title: 'Custom', collections: ['expenses'] },
  ],
} as unknown as AuthorizationOptionsResponse;
function text(key: string, fallback?: string): string {
  let value: unknown = enUS;
  for (const part of key.split('.'))
    value =
      value && typeof value === 'object' ? Reflect.get(value, part) : undefined;
  return typeof value === 'string' ? value : (fallback ?? key);
}
it('collects native custom filter parameters before changing the draft, then saves and reopens them', async () => {
  const user = userEvent.setup(),
    save = vi.fn();
  function Role() {
    const [grants, setGrants] = useState<readonly PermissionGrant[]>([
      {
        resource: { type: 'composite', id: 'expenses.records' },
        actions: [
          {
            action: 'view',
            policy: {
              type: 'composite',
              scopes: { records: 'recordsIOwn', unrelated: { keep: true } },
            },
          },
        ],
      },
    ]);
    const [editing, setEditing] = useState<string>();
    const sections = configurePermissionScopes(
      permissionSections(catalog, grants, (value) =>
        typeof value === 'string' ? value : text(value.key),
      ),
      catalog,
      grants,
      text,
      editing,
      setEditing,
      (id, value) => setGrants((current) => setScope(current, id, value)),
      false,
    );
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save(grants);
        }}
      >
        <PermissionEditor
          sections={sections}
          onEnabledChange={vi.fn()}
          onLevelChange={(id, level) => {
            if (level === 'customFilter') setEditing(id);
            else setGrants((current) => setScope(current, id, level));
          }}
        />
        <button type='submit'>Save role</button>
      </form>
    );
  }
  render(<Role />);
  const scope = screen.getByRole('combobox', {
    name: 'How far View · Records reaches',
  });
  expect(scope).toHaveTextContent('Own');
  await user.click(scope);
  await user.click(await screen.findByRole('option', { name: 'Custom' }));
  expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  expect(save).not.toHaveBeenCalled();
  await user.type(screen.getByRole('textbox', { name: 'Value 1' }), 'Finance');
  await user.keyboard('{Enter}');
  expect(save).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  expect(scope).toHaveTextContent('Custom');
  await user.click(screen.getByRole('button', { name: 'Save role' }));
  expect(save.mock.calls[0]?.[0][0].actions[0].policy.scopes).toEqual({
    records: {
      type: 'recordAccess',
      key: 'customFilter',
      params: {
        filter: {
          kind: 'group',
          logic: 'and',
          items: [
            {
              kind: 'condition',
              path: ['department'],
              operator: '$eq',
              value: 'Finance',
            },
          ],
        },
      },
    },
    unrelated: { keep: true },
  });
  await user.click(screen.getByRole('button', { name: 'Conditions' }));
  expect(screen.getByRole('textbox', { name: 'Value 1' })).toHaveValue(
    'Finance',
  );
});
