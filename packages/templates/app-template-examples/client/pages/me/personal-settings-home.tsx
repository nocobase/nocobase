import { useTranslation } from '@nocobase/i18n/client';
import { useMemo, type ReactElement } from 'react';
import { Navigate } from 'react-router';

import { Loading } from '#components/loading';
import { PageContainer } from '#components/page-container';
import { Empty, EmptyHeader, EmptyTitle } from '#components/ui/empty';

import { useRouteAccess, useRouteTree } from '../../routing/route-context.js';
import {
  buildPersonalSettingsNavigation,
  firstNavigationPage,
} from '../../routing/route-navigation.js';

/** `/me` itself: opens the first personal settings page the viewer may open. */
export default function PersonalSettingsHomePage(): ReactElement {
  const { t } = useTranslation();
  const routes = useRouteTree();
  const { denied, loading } = useRouteAccess();
  const target = useMemo(
    () => firstNavigationPage(buildPersonalSettingsNavigation(routes, denied)),
    [routes, denied],
  );
  if (loading) return <Loading />;
  if (target) return <Navigate replace to={target.path} />;
  return (
    <PageContainer>
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyTitle>{t('settings.personal.empty')}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </PageContainer>
  );
}
