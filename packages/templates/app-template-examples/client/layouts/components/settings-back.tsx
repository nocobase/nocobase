import { useTranslation } from '@nocobase/i18n/client';
import { ArrowLeft } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, useLocation } from 'react-router';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '#components/ui/sidebar';

import {
  isAnySettingsPath,
  isOpeningLocation,
  readSettingsReturn,
} from '../../routing/settings-shell.js';

/** The first entry of the system and personal settings navigations: back to where the viewer came from. */
export function SettingsBack(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const label = t('settings.back', { defaultValue: 'Back' });
  // Read on every settings location, after the layout stored the page the viewer left (`useRememberSettingsReturn`); the
  // settings page the document opened on leads home.
  const to =
    isAnySettingsPath(location.pathname) && !isOpeningLocation(location)
      ? readSettingsReturn()
      : '/';
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link
                  to={to}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                />
              }
              tooltip={{ children: label, role: 'tooltip', sideOffset: 8 }}
            >
              <ArrowLeft />
              <span>{label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
