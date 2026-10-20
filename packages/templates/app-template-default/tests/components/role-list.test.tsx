import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { RoleList } from '../../client/components/role-list.js';

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
describe('compact role list', () => {
  it('renders ordinary list content with full names, identifiers and translated state labels', () => {
    render(
      <MemoryRouter>
        <RoleList
          roles={roles}
          ariaLabel='角色与权限'
          labels={{ protected: '受保护', custom: '自定义' }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('list', { name: '角色与权限' })).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
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
                labels={{ protected: 'Protected', custom: 'Custom' }}
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
    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Edit member')).toBeVisible();
  });
});
