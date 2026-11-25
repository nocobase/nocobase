import { useTranslation } from '@nocobase/i18n/client';
import { Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { buttonVariants } from '#components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';
import { SETTINGS_HOME } from '#lib/navigation-transform';
import { useRouteAccess, useRouteTree } from '../../routing/route-context.js';
import { buildRouteNavigation } from '../../routing/route-navigation.js';
import { isSettingsPath } from '../../routing/settings-shell.js';

export function SystemSettingsButton() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { denied, loading } = useRouteAccess();
  const routes = useRouteTree();
  if (loading) return null;
  const entry = buildRouteNavigation(routes, denied).find(
    (item) => item.route.name === SETTINGS_HOME,
  );
  if (!entry) return null;
  const active = isSettingsPath(pathname);
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Link to={entry.route.path} />}
        className={buttonVariants({
          variant: active ? 'secondary' : 'ghost',
          size: 'icon',
        })}
        aria-current={active ? 'location' : undefined}
        aria-label={t('settings.title')}
      >
        <Settings />
      </TooltipTrigger>
      <TooltipContent side='bottom'>{t('settings.title')}</TooltipContent>
    </Tooltip>
  );
}
