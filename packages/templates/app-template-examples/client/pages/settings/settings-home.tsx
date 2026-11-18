import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { useTranslation } from '@nocobase/i18n/client';
import { ChevronRight, Settings } from 'lucide-react';
import { useMemo, type ReactElement } from 'react';
import { Link } from 'react-router';

import { Loading } from '#components/loading';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Empty, EmptyHeader, EmptyTitle } from '#components/ui/empty';
import type { SettingsModule } from '#lib/navigation-transform';

import { useRouteAccess, useRouteTree } from '../../routing/route-context.js';
import {
  buildSettingsCatalog,
  routeKey,
} from '../../routing/route-navigation.js';

/**
 * The System settings home: the settings modules the viewer may open, as cards grouped by category. Everything shown
 * comes from the registered routes and the shell's permission check, so a module appears here once it is registered
 * under a settings category, and disappears with its permission.
 */
export default function SettingsHomePage(): ReactElement {
  const { t } = useTranslation();
  const routes = useRouteTree();
  const { denied, loading } = useRouteAccess();
  const categories = useMemo(
    () => buildSettingsCatalog(routes, denied),
    [routes, denied],
  );
  return (
    <PageContainer className='space-y-8'>
      <PageHeader
        title={t('settings.title')}
        description={t('settings.home.description')}
      />
      {loading ? (
        <Loading />
      ) : categories.length === 0 ? (
        <Empty className='border border-dashed'>
          <EmptyHeader>
            <EmptyTitle>{t('settings.home.empty')}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        categories.map((category) => {
          const title = routeText(t, category.route, 'title');
          return (
            <section
              key={routeKey(category.route)}
              aria-label={title}
              className='space-y-3'
            >
              <h2 className='font-heading text-base font-semibold'>{title}</h2>
              <ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                {category.modules.map((module) => (
                  <li key={routeKey(module.route)} className='min-w-0'>
                    <SettingsCard module={module} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </PageContainer>
  );
}

function SettingsCard({ module }: { module: SettingsModule }): ReactElement {
  const { t } = useTranslation();
  // The card's text is its accessible name: the module and what it is for.
  const title = routeText(t, module.route, 'title');
  const description = routeText(t, module.route, 'description');
  const Icon = module.route.navigation?.icon ?? Settings;
  return (
    <Link
      to={module.target.path}
      className='group flex h-full items-start gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-xs transition-colors outline-none hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50'
    >
      <span className='flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:text-foreground'>
        <Icon className='size-4' />
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block font-medium'>{title}</span>
        {description ? (
          <span className='mt-1 block text-sm leading-6 text-muted-foreground'>
            {description}
          </span>
        ) : null}
      </span>
      <ChevronRight
        aria-hidden
        className='mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground'
      />
    </Link>
  );
}

/** A navigation text of a route, translated in the namespace of the package that registered it. */
function routeText(
  t: ReturnType<typeof useTranslation>['t'],
  route: AppClientRegisteredRoute,
  field: 'title' | 'description',
): string | undefined {
  const key = route.navigation?.[field];
  return key ? t(key, { ns: route.packageName, defaultValue: key }) : undefined;
}
