import { Trans } from 'react-i18next';
import { useClientApplication } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { ShieldCheck } from 'lucide-react';
import type { ReactElement } from 'react';

import { SidebarFooter, useSidebar } from '#components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';

/**
 * The application's sidebar footer: the NocoBase slogan's two lines, then the application's version.
 * In icon mode only the shield remains, and a tooltip carries the same text.
 */
export function AppSidebarFooter(): ReactElement {
  const { t } = useTranslation();
  const { isMobile, state } = useSidebar();
  const iconOnly = state === 'collapsed' && !isMobile;
  // Published by the server from the application's package.json.
  const publicConfig = useClientApplication().config.public;
  const templateVersion = publicConfig.get('app.version', '0.0.0');
  const versionLabel = `v${templateVersion}`;
  // The tooltip and the icon's accessible name have no link, so the brand's markup is dropped there.
  const brandPartnership = t('shell.brandPartnership', {
    defaultValue: 'AI + <brand>NocoBase</brand>',
  }).replace(/<\/?brand>/g, '');
  const buildReliableSystems = t('shell.buildReliableSystems', {
    defaultValue: 'Build reliable business systems',
  });

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
    <SidebarFooter className='shrink-0 border-t border-sidebar-border'>
      {/* The menu button's inset (`p-2`, `gap-2`), so the shield lines up with the menu icons above. */}
      <div className='flex min-w-0 items-start gap-2 p-2 text-xs leading-5'>
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                aria-label={
                  iconOnly
                    ? `${brandPartnership} ${buildReliableSystems} ${versionLabel}`
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
            <span className='font-medium'>{brandPartnership}</span>
            <span>{buildReliableSystems}</span>
            <span className='mt-1 opacity-70'>{versionLabel}</span>
          </TooltipContent>
        </Tooltip>
        <div className='min-w-0 flex-1 group-data-[collapsible=icon]:hidden'>
          <p className='font-medium text-balance text-sidebar-foreground'>
            <Trans
              t={t}
              i18nKey='shell.brandPartnership'
              defaults='AI + <brand>NocoBase</brand>'
              components={{ brand: brandLink }}
            >
              AI + {brandLink}
            </Trans>
          </p>
          <p className='text-balance text-muted-foreground'>
            {buildReliableSystems}
          </p>
          <p
            className='mt-1 truncate text-muted-foreground'
            title={versionLabel}
          >
            {versionLabel}
          </p>
        </div>
      </div>
    </SidebarFooter>
  );
}
