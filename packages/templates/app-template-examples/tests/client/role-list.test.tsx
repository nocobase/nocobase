import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import type { ReactElement } from 'react';
import { render as renderView, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { RoleList } from '../../client/components/role-list.js';

import enUS from '../../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  application: { namespace: 'role-table-test', resources: enUS },
});
function render(view: ReactElement) {
  return renderView(
    <TestI18nProvider runtime={runtime}>{view}</TestI18nProvider>,
  );
}

const roles = [
  {
    key: 'member',
    title: 'Member',
    to: { pathname: '/roles/member/edit', search: '?q=team' },
    protected: true,
  },
  {
    key: 'team',
    title: 'A very long role name that remains available in full',
    to: '/roles/team/edit',
    protected: false,
  },
];
describe('standard role table', () => {
  it('renders standard table headers, full names, identifiers and translated state labels', () => {
    render(
      <MemoryRouter>
        <RoleList
          roles={roles}
          ariaLabel='角色与权限'
          labels={{
            name: '角色名称',
            key: '标识',
            type: '类型',
            protected: '受保护',
            custom: '自定义',
          }}
        />
      </MemoryRouter>,
    );
    expect(
      within(screen.getByRole('region', { name: '角色与权限' })).getByRole(
        'table',
      ),
    ).toBeVisible();
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(
      screen.queryByRole('heading', { name: 'Member' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTitle(roles[1]!.title)).toHaveTextContent(
      roles[1]!.title,
    );
    expect(screen.getByTitle('team')).toHaveTextContent('team');
    expect(screen.getByText('受保护')).toBeVisible();
    expect(screen.getByText('自定义')).toBeVisible();
  });
  it('keeps keyboard navigation and the supplied edit path and query', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Routes>
          <Route
            path='/'
            element={
              <RoleList
                roles={roles}
                labels={{
                  name: 'Role name',
                  key: 'Key',
                  type: 'Type',
                  protected: 'Protected',
                  custom: 'Custom',
                }}
              />
            }
          />
          <Route path='/roles/member/edit' element={<p>Edit member</p>} />
        </Routes>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', {
      name: 'Member',
    });
    expect(link).toHaveAttribute('href', '/roles/member/edit?q=team');
    for (let i = 0; i < 8 && document.activeElement !== link; i++)
      await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Edit member')).toBeVisible();
  });
  it('uses standard pagination without losing edit links on later pages', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RoleList
          roles={Array.from({ length: 12 }, (_, i) => ({
            key: `role-${i}`,
            title: `Role ${i}`,
            to: `/roles/role-${i}/edit`,
            protected: false,
          }))}
          labels={{
            name: 'Role name',
            key: 'Key',
            type: 'Type',
            protected: 'Protected',
            custom: 'Custom',
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('row')).toHaveLength(11);
    expect(
      screen.queryByRole('link', { name: 'Role 11', exact: true }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(
      screen.getByRole('link', { name: 'Role 11', exact: true }),
    ).toHaveAttribute('href', '/roles/role-11/edit');
  });
});
