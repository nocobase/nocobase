import { useTranslation } from '@nocobase/i18n/client';
import { AppWindow, UserRound, ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { buttonVariants } from '#components/ui/button';
import { useRouteAccess, useRouteTree } from '../../routing/route-context.js';
import packageMetadata from '../../../package.json' with { type: 'json' };
import { findApiKeysManagement } from './capability-management.js';
import {
  CurrentApplication,
  ConfigurationItem,
  ConfigurationActions,
} from './detail-layout.js';

export default function ApiKeysReadiness({
  personalGuide,
  applicationGuide,
}: {
  personalGuide: ReactNode;
  applicationGuide: ReactNode;
}) {
  const { t } = useTranslation(packageMetadata.name);
  const routes = useRouteTree();
  const access = useRouteAccess();
  const prefix = 'featureOverview.apiKeys';
  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <CurrentApplication>
        {(['personal', 'application'] as const).map((scope) => {
          const page = findApiKeysManagement(routes, access.denied, scope);
          return (
            <ConfigurationItem
              key={scope}
              title={t(`${prefix}.${scope}Title`)}
              description={t(`${prefix}.${scope}Description`)}
              state={!!page}
              icon={scope === 'personal' ? UserRound : AppWindow}
            >
              {page ? (
                access.loading ? (
                  <p role='status' className='text-xs text-muted-foreground'>
                    {t(`${prefix}.checkingAccess`)}
                  </p>
                ) : page.denied ? (
                  <p className='text-xs text-muted-foreground'>
                    {t(`${prefix}.interfaceDenied`)}
                  </p>
                ) : (
                  <Link
                    to={page.route.path}
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                    })}
                  >
                    {t(
                      `${prefix}.${scope === 'personal' ? 'openInterface' : 'openApplication'}`,
                    )}
                    <ArrowRight aria-hidden />
                  </Link>
                )
              ) : null}
            </ConfigurationItem>
          );
        })}
      </CurrentApplication>
      <ConfigurationActions>
        {personalGuide}
        {applicationGuide}
      </ConfigurationActions>
    </div>
  );
}
