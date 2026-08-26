import { NoSSR, useI18n, useSite } from '@rspress/core/runtime';
import { SwitchAppearance } from '@rspress/core/theme';
import './NavScreenAppearance.scss';

export function NavScreenAppearance() {
  const { site } = useSite();
  const hasAppearanceSwitch = site.themeConfig.darkMode !== false;
  const t = useI18n();
  return (
    <>
      {hasAppearanceSwitch && (
        <div className="rp-nav-screen-appearance">
          <div className="rp-nav-screen-appearance__left">{t('themeText')}</div>
          <div className="rp-nav-screen-appearance__right">
            <NoSSR>
              <SwitchAppearance />
            </NoSSR>
          </div>
        </div>
      )}
    </>
  );
}
