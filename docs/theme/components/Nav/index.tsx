import { useNav, useSite } from '@rspress/core/runtime';
import {
  NavTitle,
  Search,
  SocialLinks,
  SwitchAppearance,
} from '@rspress/core/theme';
import './index.scss';
import { NavLangs, NavMenu, NavMenuDivider, NavVersions } from './NavMenu';
import { NavHamburger } from '../NavHamburger';

export interface NavProps {
  beforeNavTitle?: React.ReactNode;
  navTitle?: React.ReactNode;
  afterNavTitle?: React.ReactNode;

  beforeNavMenu?: React.ReactNode;
  afterNavMenu?: React.ReactNode;
}

export function Nav(props: NavProps) {
  const {
    beforeNavTitle,
    afterNavTitle,
    beforeNavMenu,
    afterNavMenu,
    navTitle,
  } = props;
  const navList = useNav();
  const { site } = useSite();
  const hasAppearanceSwitch = site.themeConfig.darkMode !== false;

  return (
    <header className="rp-nav">
      <div className="rp-nav__left">
        {beforeNavTitle}
        {navTitle ?? <NavTitle />}
        {/* only in desktop */}
        <NavMenu menuItems={navList} position="left" />
        {afterNavTitle}
      </div>

      <div className="rp-nav__right">
        {beforeNavMenu}
        <Search />

        {/* only in desktop */}
        <NavMenu menuItems={navList} position="right" />
        <div className="rp-nav__others">
          <NavMenuDivider />
          <NavLangs />
          <NavVersions />
          {hasAppearanceSwitch && <SwitchAppearance />}
          <SocialLinks />
        </div>

        {/* only in mobile */}
        <NavHamburger />
        {afterNavMenu}
      </div>
    </header>
  );
}
