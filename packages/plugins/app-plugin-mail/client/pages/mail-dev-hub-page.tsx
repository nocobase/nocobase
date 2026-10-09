import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import {
  matchPath,
  Navigate,
  Link,
  NavLink,
  Outlet,
  useLocation,
  useResolvedPath,
  resolvePath,
} from 'react-router';
import { MailDevPageShell } from '../components/mail-dev-page-shell.js';
import MailSendPage from './mail-send-page.js';
import { MailBulkSendLogs } from '../components/mail-bulk-send-logs.js';

export function MailSendHubPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const parent = useResolvedPath('.');
  if (!matchPath({ path: parent.pathname, end: true }, location.pathname))
    return <Outlet />;
  return (
    <MailDevPageShell
      title={t('dev.sendHub.title', { defaultValue: 'Compose mail' })}
      description={t('dev.sendHub.description', {
        defaultValue:
          'Write once, then send to all recipients together or separately.',
      })}
      actions={
        <Link
          className='rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted'
          to={resolvePath('../logs', parent.pathname)}
        >
          {t('dev.logsHub.title', { defaultValue: 'Mail logs' })}
        </Link>
      }
    >
      <MailSendPage />
    </MailDevPageShell>
  );
}
export function MailComposeRedirect(): ReactElement {
  return <LegacyRedirect to='..' />;
}
export function MailLogsHubPage(): ReactElement {
  return <MailDevHub />;
}
export function MailBulkLogsPage(): ReactElement {
  return <MailBulkSendLogs />;
}
function MailDevHub(): ReactElement {
  const tabs = ['sync', 'send', 'bulk'];
  const { t } = useTranslation();
  const location = useLocation();
  const parent = useResolvedPath('.');
  if (matchPath({ path: parent.pathname, end: true }, location.pathname)) {
    return (
      <Navigate replace to={{ pathname: 'sync', search: location.search }} />
    );
  }
  return (
    <MailDevPageShell
      title={t('dev.logsHub.title')}
      description={t('dev.logsHub.description')}
      navigation={
        <nav
          aria-label={t('dev.logsHub.title')}
          className='flex flex-wrap gap-1'
        >
          {tabs.map((tab) => (
            <NavLink
              key={tab}
              to={{ pathname: tab, search: location.search }}
              className={({ isActive }) =>
                `border-b-2 px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`
              }
            >
              {t(`dev.logsHub.${tab}`)}
            </NavLink>
          ))}
        </nav>
      }
    >
      <Outlet />
    </MailDevPageShell>
  );
}
function LegacyRedirect({ to }: { readonly to: string }): ReactElement {
  const location = useLocation();
  return (
    <Navigate
      relative='path'
      replace
      to={{ pathname: to, search: location.search }}
    />
  );
}
export function MailBulkSendRedirect(): ReactElement {
  return <LegacyRedirect to='../send' />;
}
export function MailSendLogsRedirect(): ReactElement {
  return <LegacyRedirect to='../logs/send' />;
}
export function MailSyncLogsRedirect(): ReactElement {
  return <LegacyRedirect to='../logs/sync' />;
}
