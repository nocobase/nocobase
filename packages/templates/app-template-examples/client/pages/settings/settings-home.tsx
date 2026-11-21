import { useTranslation } from '@nocobase/i18n/client';
import { useMemo, type ReactElement } from 'react';
import { Navigate } from 'react-router';

import { Loading } from '#components/loading';
import { PageContainer } from '#components/page-container';
import { Empty, EmptyHeader, EmptyTitle } from '#components/ui/empty';

import { useRouteAccess, useRouteTree } from '../../routing/route-context.js';
import {
  buildSettingsNavigation,
  firstNavigationPage,
} from '../../routing/route-navigation.js';

/**
 * `/settings` itself: opens the first system settings page the viewer may open, in the order of the settings menu.
 * A viewer who may open none sees an empty state instead.
 */
export default function SettingsHomePage(): ReactElement {
  const { t } = useTranslation();
  const routes = useRouteTree();
  const { denied, loading } = useRouteAccess();
  const target = useMemo(
    () => firstNavigationPage(buildSettingsNavigation(routes, denied)),
    [routes, denied],
  );
  if (loading) return <Loading />;
  if (target) return <Navigate replace to={target.path} />;
  return (
    <PageContainer>
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyTitle>{t('settings.home.empty')}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </PageContainer>
  );
}
