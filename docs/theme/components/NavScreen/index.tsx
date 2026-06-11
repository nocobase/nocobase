import { useNav } from '@rspress/core/runtime';
import { SocialLinks } from '@rspress/core/theme';
import { clearAllBodyScrollLocks, disableBodyScroll } from 'body-scroll-lock';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import './index.scss';
import { NavScreenAppearance } from './NavScreenAppearance';
import { NavScreenLangs } from './NavScreenLangs';
import { NavScreenMenu } from './NavScreenMenu';
import { NavScreenVersions } from './NavScreenVersions';

export interface NavScreenProps {
  isScreenOpen: boolean;
  toggleScreen: () => void;
}

export function NavScreenDivider() {
  return <div className="rp-nav-screen-divider"></div>;
}

export function NavScreen(props: NavScreenProps) {
  const { isScreenOpen, toggleScreen } = props;
  const screen = useRef<HTMLDivElement | null>(null);
  const menuItems = useNav();

  useEffect(() => {
    if (screen.current && isScreenOpen) {
      disableBodyScroll(screen.current, { reserveScrollBarGap: true });
      const style = `:root { --rp-home-background-bg: transparent; }`;
      const styleElement = document.createElement('style');
      styleElement.id = 'rp-nav-screen-body-lock-style';
      styleElement.innerHTML = style;
      document.head.appendChild(styleElement);
    }
    return () => {
      clearAllBodyScrollLocks();
      const styleElement = document.getElementById(
        'rp-nav-screen-body-lock-style',
      );
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [isScreenOpen]);

  return (
    <div
      className={clsx('rp-nav-screen', { 'rp-nav-screen--open': isScreenOpen })}
      ref={screen}
      onClick={toggleScreen}
    >
      <div
        className="rp-nav-screen__container"
        onClick={e => e.stopPropagation()}
      >
        <NavScreenMenu menuItems={menuItems} />
        <NavScreenDivider />
        <NavScreenAppearance />
        <NavScreenLangs />
        <NavScreenVersions />
        <NavScreenDivider />
        <SocialLinks />
      </div>
    </div>
  );
}
