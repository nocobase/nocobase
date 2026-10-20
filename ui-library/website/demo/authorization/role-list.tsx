import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { RoleList } from '#components/role-list';

export function RoleListDemo(): ReactElement {
  return (
    <MemoryRouter>
      <div className='min-h-svh bg-background p-6 text-foreground'>
        <RoleList
          ariaLabel='Roles'
          labels={{ protected: 'Protected', custom: 'Custom' }}
          roles={[
            {
              key: 'member',
              title: 'Member',
              to: '/roles/member/edit',
              protected: true,
            },
            {
              key: 'root',
              title: 'System administrator',
              to: '/roles/root/edit',
              protected: true,
            },
            ...Array.from({ length: 18 }, (_, index) => ({
              key: `department-${index + 1}`,
              title: `Department ${index + 1}`,
              to: `/roles/department-${index + 1}/edit`,
              protected: false,
            })),
            {
              key: 'a-long-role-identifier-to-check-narrow-layouts',
              title:
                'A role with a long localized name that should not stretch the list',
              to: '/roles/long/edit',
              protected: false,
            },
          ]}
        />
      </div>
    </MemoryRouter>
  );
}
