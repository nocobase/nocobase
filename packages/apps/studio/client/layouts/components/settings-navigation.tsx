import { useTranslation } from '@nocobase/i18n/client';
import { ArrowLeft } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, useLocation } from 'react-router';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

import { useSettingsSections } from '../../pages/config/sections.js';
import { useReturnLocations } from '../return-locations.js';

/**
 * What the app's sidebar shows inside the workspace settings (`/config`), in place of the app's navigation: Back to
 * the page the person was on before, then the settings pages the viewer may read, grouped. In the desktop icon mode
 * the labels hide and each button carries its label as a tooltip; on a phone choosing a page closes the sheet.
 */
export function SettingsNavigation(): ReactElement {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { beforeSettings } = useReturnLocations();
  const { groups } = useSettingsSections();
  const { isMobile, setOpenMobile } = useSidebar();
  const onNavigate = (): void => {
    if (isMobile) setOpenMobile(false);
  };
  const back = t('config.nav.back');

  return (
    <nav aria-label={t('config.nav.label')}>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to={beforeSettings} onClick={onNavigate} />}
              tooltip={back}
              className='text-sidebar-foreground/70'
            >
              <ArrowLeft />
              <span>{back}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      {groups.map((group) => (
        <SidebarGroup
          key={group.id}
          role='group'
          aria-labelledby={`studio-settings-${group.id}`}
        >
          <SidebarGroupLabel id={`studio-settings-${group.id}`}>
            {t(group.label)}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.sections.map((section) => {
                const to = `/config/${section.path}`;
                const active = pathname === to || pathname.startsWith(`${to}/`);
                const label = t(section.label);
                const Icon = section.icon;
                return (
                  <SidebarMenuItem key={section.path}>
                    <SidebarMenuButton
                      render={
                        <Link
                          to={to}
                          onClick={onNavigate}
                          aria-current={active ? 'page' : undefined}
                        />
                      }
                      isActive={active}
                      tooltip={label}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </nav>
  );
}
