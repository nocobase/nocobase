// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  PermissionEditor,
  type PermissionObject,
} from '../../client/components/permission-editor.js';

const releases: PermissionObject = {
  id: 'rel:rel.apps',
  label: 'Apps',
  actions: [
    { id: 'view', label: 'View', view: true },
    { id: 'deploy', label: 'Deploy', risk: 'high' },
    {
      id: 'configure',
      label: 'Configure',
      managed: true,
      humanOnly: 'Configuring an App is a person’s only',
    },
    { id: 'rollback', label: 'Roll back', lapsed: true },
  ],
  footnote: 'You don’t have: Delete',
};

describe('the permission table of a credential', () => {
  it('falls back to page access when the operations catalog becomes empty', () => {
    const props = {
      menus: [],
      value: { menus: [], grants: {} },
      onChange: vi.fn(),
      defaultTab: 'objects' as const,
    };
    const view = render(<PermissionEditor {...props} objects={[releases]} />);
    expect(screen.getByRole('tab', { name: /Operations/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    view.rerender(<PermissionEditor {...props} objects={[]} />);
    expect(screen.queryByRole('tab', { name: /Operations/ })).toBeNull();
    expect(screen.getByRole('tab', { name: /Page access/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
  it('shows only the tabs asked for, an action only a person may take greyed out with its reason, and lapsed ones', () => {
    render(
      <PermissionEditor
        menus={[]}
        objects={[releases]}
        value={{ menus: [], grants: { view: {}, rollback: {} } }}
        onChange={vi.fn()}
        builtInTabs={['objects', 'settings']}
        showTabCounts={false}
        defaultTab='menus'
      />,
    );
    expect(screen.queryByRole('tab', { name: /Page access/ })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Operations' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const humanOnly = screen.getByText('People only');
    expect(humanOnly).toHaveAttribute(
      'title',
      'Configuring an App is a person’s only',
    );
    const configure = screen.getByRole('checkbox', { name: 'Configure' });
    expect(configure).toHaveAttribute('aria-disabled', 'true');
    expect(configure).not.toBeChecked();
    expect(screen.getByText('Lapsed')).toBeInTheDocument();
    expect(screen.getByText('Roll back')).toHaveClass('line-through');
    const row = screen
      .getByText('You don’t have: Delete')
      .closest('[data-slot=permission-object-footnote]');
    expect(row).not.toBeNull();
    expect(
      within(screen.getByText('Deploy').parentElement!).getByText('High risk'),
    ).toBeInTheDocument();
  });
});
