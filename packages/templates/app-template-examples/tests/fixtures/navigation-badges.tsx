import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { Inbox, Mail } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';

import {
  AppSidebar,
  AppSidebarProvider,
} from '../../client/layouts/components/app-sidebar';
import { NavigationMenu } from '../../client/layouts/components/navigation-menu';
import {
  createAppSidebarPreferenceStore,
  SidebarPreferenceProvider,
} from '../../client/layouts/use-sidebar-preference';
import type { RouteNavigationItem } from '../../client/routing/route-navigation';
import '../../client/styles.css';

// Long labels beside counts and expand buttons in the real sidebar and application stylesheet. No backend or
// authentication is needed for this fixture.
const runtime = await createTestI18nRuntime({ strict: false });

function page(
  name: string,
  title: string,
  count?: number,
  icon = Mail,
): AppClientRegisteredRoute {
  return {
    name,
    id: name,
    path: `/${name}`,
    auth: 'required',
    packageName: 'fixture',
    source: 'application',
    navigation: {
      title,
      icon,
      ...(count === undefined ? {} : { badge: () => ({ count }) }),
    },
    componentLoader: async () => ({ default: () => null }),
  };
}

const long = 'Personal messages and notifications received today';
const items: RouteNavigationItem[] = [
  {
    route: page('counted-parent', long, 120, Inbox),
    children: [{ route: page('counted-child', long, 7), children: [] }],
  },
  {
    route: page('plain-parent', long),
    children: [{ route: page('plain-child', 'Archive'), children: [] }],
  },
  { route: page('counted-leaf', long, 5), children: [] },
];

createRoot(document.getElementById('root')!).render(
  <TestI18nProvider runtime={runtime}>
    <MemoryRouter>
      <SidebarPreferenceProvider
        value={createAppSidebarPreferenceStore('/fixture')}
      >
        <AppSidebarProvider>
          <AppSidebar label='Navigation'>
            <NavigationMenu
              items={items}
              label='Menu'
              selectedKey='counted-child'
            />
          </AppSidebar>
        </AppSidebarProvider>
      </SidebarPreferenceProvider>
    </MemoryRouter>
  </TestI18nProvider>,
);
