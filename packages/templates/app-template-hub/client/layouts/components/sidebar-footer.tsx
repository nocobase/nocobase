import { Trans } from 'react-i18next';
import { useClientApplication } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { ShieldCheck } from 'lucide-react';
import type { ReactElement } from 'react';

import { SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * The application's sidebar footer: the NocoBase slogan's two lines, then the template's name and its version, each
 * on its own line. In icon mode only the shield remains, and a tooltip carries the same text.
 */
export function AppSidebarFooter(): ReactElement {
  const { t } = useTranslation();
  const { isMobile, state } = useSidebar();
  const iconOnly = state === 'collapsed' && !isMobile;
  // Published by the server from the application's package.json.
  const publicConfig = useClientApplication().config.public;
  const templateName = publicConfig.get('app.displayName', 'NocoBase Hub');
  const templateVersion = publicConfig.get('app.version', '0.0.0');
  const versionLabel = `v${templateVersion}`;
  const buildFreely = t('shell.buildFreely', {
    defaultValue: 'AI builds freely.',
  });
  // The tooltip and the icon's accessible name have no link, so the brand's markup is dropped there.
  const reliability = t('shell.reliability', {
    defaultValue: '<brand>NocoBase</brand> keeps it reliable.',
  }).replace(/<\/?brand>/g, '');

  const brandLink = (
    <a
      className='rounded-sm text-sidebar-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-sidebar-ring'
      href='https://www.nocobase.com'
      rel='noopener noreferrer'
      target='_blank'
    >
      NocoBase
    </a>
  );

  return (
    <SidebarFooter className='shrink-0 border-t border-sidebar-border/70'>
      {/* The menu button's inset (`p-2`, `gap-2`), so the shield lines up with the menu icons above. */}
      <div className='flex min-w-0 items-start gap-2 p-2 text-xs leading-5'>
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                aria-label={
                  iconOnly
                    ? `${buildFreely} ${reliability} ${templateName} ${versionLabel}`
                    : undefined
                }
                className='flex h-5 shrink-0 items-center rounded-sm text-sidebar-foreground/80 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring'
                role={iconOnly ? 'img' : undefined}
                tabIndex={iconOnly ? 0 : undefined}
              />
            }
          >
            <ShieldCheck aria-hidden className='size-4' />
          </TooltipTrigger>
          <TooltipContent
            className='max-w-56 flex-col items-start gap-0.5'
            hidden={!iconOnly}
            side='right'
          >
            <span className='font-medium'>{buildFreely}</span>
            <span>{reliability}</span>
            <span className='mt-1 opacity-70'>
              {templateName} {versionLabel}
            </span>
          </TooltipContent>
        </Tooltip>
        <div className='min-w-0 flex-1 group-data-[collapsible=icon]:hidden'>
          <p className='font-medium text-balance text-sidebar-foreground'>
            {buildFreely}
          </p>
          <p className='text-balance text-muted-foreground'>
            <Trans
              t={t}
              i18nKey='shell.reliability'
              defaults='<brand>NocoBase</brand> keeps it reliable.'
              components={{ brand: brandLink }}
            >
              {brandLink} keeps it reliable.
            </Trans>
          </p>
          {/* Name and version stay on one line each; a long name is cut off, with the whole name as its title. */}
          <p
            className='mt-1 truncate text-muted-foreground'
            title={templateName}
          >
            {templateName}
          </p>
          <p className='truncate text-muted-foreground' title={versionLabel}>
            {versionLabel}
          </p>
        </div>
      </div>
    </SidebarFooter>
  );
}
