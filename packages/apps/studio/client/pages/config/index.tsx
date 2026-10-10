import {
  PmDetailSkeleton,
  PmEmpty,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { Settings2Icon } from 'lucide-react';
import type { ReactElement } from 'react';
import {
  matchPath,
  Navigate,
  Outlet,
  useLocation,
  useResolvedPath,
} from 'react-router';

import { PageContainer } from '@/components/page-container';

import { useSettingsSections } from './sections.js';

/**
 * Route `/config`: Studio's settings, in the app rather than the system settings. Its pages are child routes, listed
 * by the settings navigation that replaces the app's sidebar here (`layouts/components/settings-navigation.tsx`), each
 * shown only when the viewer may read its settings item (the routes check the same); the bare URL opens the first.
 * The area draws no heading of its own: each page's title is its `h1` (`SettingsPageHeader`), with the read-only
 * notice when the viewer may not change that page.
 */
export default function ConfigPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const base = useResolvedPath('.');
  const isParentEntry =
    matchPath({ path: base.pathname, end: true }, location.pathname) !== null;
  const viewer = useViewer();
  const { groups } = useSettingsSections();
  const first = groups[0]?.sections[0];

  let content: ReactElement;
  if (!viewer) content = <PmDetailSkeleton />;
  else if (!first)
    content = (
      <PmEmpty
        icon={<Settings2Icon />}
        title={t('config.noAccess')}
        description={t('config.noAccessDescription')}
      />
    );
  else if (isParentEntry)
    return <Navigate replace to={{ pathname: first.path }} />;
  else content = <Outlet />;

  return <PageContainer>{content}</PageContainer>;
}
