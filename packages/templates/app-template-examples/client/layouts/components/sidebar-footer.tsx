import { Trans } from 'react-i18next';
import { useClientApplication } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { ShieldCheck } from 'lucide-react';
import type { ReactElement } from 'react';

export function SidebarFooter({
  collapsed,
}: {
  readonly collapsed: boolean;
}): ReactElement {
  const { t } = useTranslation();
  // Published by the server from the application's package.json.
  const publicConfig = useClientApplication().config.public;
  const templateName = publicConfig.get('app.displayName', 'Examples Template');
  const templateVersion = publicConfig.get('app.version', '0.0.0');
  const templateLabel = `${templateName} v${templateVersion}`;
  const brandLink = (
    <a
      className='rounded-sm font-medium text-sidebar-foreground hover:underline outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring'
      href='https://www.nocobase.com'
      rel='noopener noreferrer'
      target='_blank'
    >
      NocoBase
    </a>
  );

  return (
    <footer className='shrink-0 border-t border-sidebar-border/70'>
      <div
        className={`flex min-h-20 items-center gap-3 px-5 py-3 ${collapsed ? 'md:min-h-16 md:justify-center md:px-2' : ''}`}
        title={templateLabel}
      >
        <ShieldCheck className='size-4 shrink-0 text-sidebar-foreground/80' />
        <div
          className={`min-w-0 text-xs leading-4 ${collapsed ? 'md:hidden' : ''}`}
        >
          <div className='font-semibold text-sidebar-foreground'>
            {t('shell.buildFreely', { defaultValue: 'AI builds freely.' })}
          </div>
          <div className='text-sidebar-foreground/80'>
            <Trans
              t={t}
              i18nKey='shell.reliability'
              defaults='<brand>NocoBase</brand> keeps it reliable.'
              components={{
                brand: brandLink,
              }}
            >
              {brandLink} keeps it reliable.
            </Trans>
          </div>
          <div className='mt-1 font-mono text-xs text-sidebar-foreground/70'>
            {templateLabel}
          </div>
        </div>
      </div>
    </footer>
  );
}
