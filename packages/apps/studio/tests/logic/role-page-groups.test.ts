import { describe, expect, it } from 'vitest';

import { PAGE_GROUPS } from '../../client/pages/config/members/page-groups';
import { PAGES } from '../../shared/pages';

describe('the role editor’s page groups', () => {
  it('follow the sidebar’s sections and order', () => {
    expect(PAGE_GROUPS).toEqual([
      { title: null, pages: ['pm-my-issues', 'reports'] },
      {
        title: 'navigation.development',
        pages: ['pm-issues', 'pm-projects', 'knowledge'],
      },
      { title: 'navigation.releases', pages: ['rel-apps'] },
      {
        title: 'navigation.agentTeam',
        pages: ['agents', 'runtimes', 'skills', 'usage'],
      },
    ]);
  });

  it('list every grantable page once, so none is left out of the editor', () => {
    const listed = PAGE_GROUPS.flatMap((group) => group.pages);
    expect([...listed].sort()).toEqual([...PAGES].sort());
  });
});
