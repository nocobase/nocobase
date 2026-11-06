import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { DefaultAccessEditor } from '../../client/components/default-access-editor.js';

it('reports one explicit scope choice and does not mutate its controlled fields during browsing', async () => {
  const user = userEvent.setup();
  const onScopeChange = vi.fn();
  const props = {
    ruleKey: 'baseline',
    resource: 'projects',
    resources: [{ value: 'projects', label: 'Projects' }],
    scopes: [
      {
        id: 'view-projects',
        action: 'View',
        scope: 'Projects',
        value: 'own',
        options: [
          { value: 'own', label: 'Own records' },
          { value: 'all', label: 'All records' },
        ],
      },
    ],
    labels: {
      key: 'Key',
      resource: 'Business object',
      chooseResource: 'Choose an object',
      action: 'Operation',
      scope: 'Data scope',
      noScopes: 'Choose an object',
    },
    onKeyChange: vi.fn(),
    onResourceChange: vi.fn(),
    onScopeChange,
  };
  render(<DefaultAccessEditor {...props} existing />);
  expect(screen.getByRole('textbox', { name: 'Key *' })).toBeDisabled();
  expect(props.onKeyChange).not.toHaveBeenCalled();
  await user.click(screen.getByRole('combobox', { name: 'View · Projects' }));
  expect(onScopeChange).not.toHaveBeenCalled();
  await user.click(await screen.findByRole('option', { name: 'All records' }));
  expect(onScopeChange).toHaveBeenCalledExactlyOnceWith('view-projects', 'all');
});

it('groups ranges by operation, keeps independent choices and preserves explicit operation identities', async () => {
  const change = vi.fn();
  const options = [
    { value: '', label: 'No default scope' },
    { value: 'all', label: 'All records' },
  ];
  const props = {
    ruleKey: 'baseline',
    resource: 'library',
    resources: [{ value: 'library', label: 'Library' }],
    scopes: [
      {
        id: 'books',
        actionId: 'browse',
        action: 'Browse holdings',
        scope: 'Book information',
        value: '',
        options,
      },
      {
        id: 'copies',
        actionId: 'browse',
        action: 'Browse holdings',
        scope: 'Physical copies',
        value: '',
        options,
        configuration: <button type='button'>Configure conditions</button>,
      },
      {
        id: 'manage',
        actionId: 'manage',
        action: 'Manage',
        scope: 'Book information',
        value: '',
        options,
      },
      {
        id: 'settings',
        actionId: 'settings',
        action: 'Manage',
        scope: 'Settings',
        value: '',
        options,
      },
    ],
    labels: {
      key: 'Key',
      resource: 'Business object',
      chooseResource: 'Choose',
      action: 'Operation',
      scope: 'Scope',
      noScopes: 'Choose an object',
    },
    onKeyChange: vi.fn(),
    onResourceChange: vi.fn(),
    onScopeChange: change,
  };
  const view = render(<DefaultAccessEditor {...props} />);
  expect(
    screen.getAllByRole('heading', { name: 'Browse holdings' }),
  ).toHaveLength(1);
  expect(screen.getAllByRole('region', { name: 'Manage' })).toHaveLength(2);
  await userEvent.click(
    screen.getByRole('button', { name: 'Configure conditions' }),
  );
  expect(change).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole('combobox', { name: 'Browse holdings · Physical copies' }),
  );
  await userEvent.click(
    await screen.findByRole('option', { name: 'All records' }),
  );
  expect(change).toHaveBeenCalledExactlyOnceWith('copies', 'all');
  expect(
    screen.getByRole('combobox', {
      name: 'Browse holdings · Book information',
    }),
  ).toHaveTextContent('No default scope');
  view.rerender(<DefaultAccessEditor {...props} readOnly />);
  expect(
    screen
      .getAllByRole('combobox')
      .every((item) => item.hasAttribute('disabled')),
  ).toBe(true);
});
