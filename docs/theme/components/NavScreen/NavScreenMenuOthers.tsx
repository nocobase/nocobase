import { NoSSR, useSite } from '@rspress/core/runtime';
import { SocialLinks, SwitchAppearance } from '@rspress/core/theme';
import './index.scss';
import { NavScreenLangs } from './NavScreenLangs';
import { NavScreenVersions } from './NavScreenVersions';

export function NavScreenMenuOthers() {
  const { site } = useSite();
  const hasAppearanceSwitch = site.themeConfig.darkMode !== false;
  const socialLinks = site?.themeConfig?.socialLinks || [];
  const hasSocialLinks = socialLinks.length > 0;
  return (
    <div className="rp-nav-screen__others">
      {hasAppearanceSwitch && (
        <div className="rp-nav-screen__appearance">
          <NoSSR>
            <SwitchAppearance />
          </NoSSR>
        </div>
      )}
      <NavScreenLangs />
      <NavScreenVersions />
      {hasSocialLinks && <SocialLinks socialLinks={socialLinks} />}
    </div>
  );
}
