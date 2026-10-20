import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { DefaultAccessEditor } from '../../registry/authorization/default-access-editor.js';

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
