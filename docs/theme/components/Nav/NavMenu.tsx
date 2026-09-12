import type {
  NavItem,
  NavItemWithChildren,
  NavItemWithLink,
  NavItemWithLinkAndChildren,
} from '@rspress/core';
import { matchNavbar, useLocation } from '@rspress/core/runtime';
import type { HoverGroupProps } from '@rspress/core/theme';
import {
  IconArrowDown,
  Link,
  SvgWrapper,
  Tag,
  useHoverGroup,
} from '@rspress/core/theme';
import cls from 'clsx';
import { type ReactNode, useMemo } from 'react';
import { useLangsMenu, useVersionsMenu } from './hooks';
import './NavMenu.scss';
import clsx from 'clsx';

export const SvgDown = (props: React.SVGProps<SVGSVGElement>) => {
  return <SvgWrapper icon={IconArrowDown} {...props} />;
};

export function NavMenuItemInner({
  menuItem,
  children,
}: {
  menuItem: Partial<NavItemWithLink>;
  children?: ReactNode;
}) {
  return (
    <>
      {'link' in menuItem && typeof menuItem.link === 'string' ? (
        <Link
          href={menuItem.link}
          download={menuItem.download}
          className="rp-nav-menu__item__container"
          hrefLang={menuItem.lang}
          lang={menuItem.lang}
          rel={menuItem.rel}
        >
          {menuItem.text}
          {menuItem.tag && <Tag tag={menuItem.tag} />}
          {children}
        </Link>
      ) : (
        <div className="rp-nav-menu__item__container">
          {menuItem.text}
          {menuItem.tag && <Tag tag={menuItem.tag} />}
          {children}
        </div>
      )}
    </>
  );
}

export function NavMenuItemWithChildren({
  menuItem,
  activeMatcher,
}: {
  menuItem: NavItemWithChildren | NavItemWithLinkAndChildren;
  activeMatcher?: HoverGroupProps['activeMatcher'];
}) {
  const { handleMouseEnter, handleMouseLeave, hoverGroup } = useHoverGroup({
    items: menuItem.items,
    activeMatcher,
  });

  const hasItems = menuItem.items.length > 0;

  return (
    <li
      className="rp-nav-menu__item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleMouseEnter}
    >
      <NavMenuItemInner menuItem={menuItem}>
        {hasItems && <SvgDown className="rp-nav-menu__item__icon" />}
      </NavMenuItemInner>
      {hoverGroup}
    </li>
  );
}

export function NavMenuItemWithLink({
  menuItem,
}: {
  menuItem: NavItemWithLink;
}) {
  const { pathname } = useLocation();
  const isActive = useMemo(() => {
    return matchNavbar(menuItem, pathname);
  }, [menuItem, pathname]);

  return (
    <li
      className={cls(
        'rp-nav-menu__item',
        isActive ? 'rp-nav-menu__item--active' : '',
      )}
    >
      <NavMenuItemInner menuItem={menuItem} />
    </li>
  );
}

export function NavMenuItem({ menuItem }: { menuItem: NavItem }) {
  if (
    'items' in menuItem &&
    Array.isArray(menuItem.items) &&
    menuItem.items.length > 0
  ) {
    return <NavMenuItemWithChildren menuItem={menuItem} />;
  }

  if ('link' in menuItem && menuItem.link.length > 0) {
    return <NavMenuItemWithLink menuItem={menuItem as NavItemWithLink} />;
  }

  return (
    <li className="rp-nav-menu__item">
      <NavMenuItemInner menuItem={menuItem} />
    </li>
  );
}

export function NavMenuDivider() {
  return <div className="rp-nav-menu__divider"></div>;
}

export function NavLangs() {
  const { items, activeValue } = useLangsMenu();

  // Language links must use plain <a> tags instead of Rspress's Link component,
  // because each language is built separately with its own base (e.g., /cn/).
  // Rspress's Link would prepend the current base to the href, producing
  // incorrect URLs like /cn/es/ instead of /es/.
  const customChildren = (
    <>
      {items.map(item => {
        const isActive = item.text === activeValue;
        return (
          <li
            key={item.text}
            className={cls(
              'rp-hover-group__item',
              isActive && 'rp-hover-group__item--active',
            )}
          >
            <a
              href={item.link}
              aria-label={item.text}
              className="rp-hover-group__item__link rp-link"
              hrefLang={item.lang}
              lang={item.lang}
              rel={item.rel}
            >
              {item.text}
            </a>
          </li>
        );
      })}
    </>
  );

  const { handleMouseEnter, handleMouseLeave, hoverGroup } = useHoverGroup({
    items: [],
    activeMatcher: item => item.text === activeValue,
    customChildren,
  });

  return items.length > 1 ? (
    <li
      className="rp-nav-menu__item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleMouseEnter}
    >
      <div className="rp-nav-menu__item__container">
        {activeValue}
        <SvgDown className="rp-nav-menu__item__icon" />
      </div>
      {hoverGroup}
    </li>
  ) : null;
}

export function NavVersions() {
  const { activeValue, items } = useVersionsMenu();

  return items.length > 1 ? (
    <NavMenuItemWithChildren
      menuItem={{ text: activeValue, items }}
      activeMatcher={item => item.text === activeValue}
    />
  ) : null;
}

export function NavMenu({
  menuItems,
  position,
}: {
  menuItems: NavItem[];
  position: 'left' | 'right';
}) {
  const getPosition = (menuItem: NavItem) => menuItem.position ?? 'right';

  const leftOrRightMenuItems = useMemo(() => {
    return menuItems.filter(item => getPosition(item) === position);
  }, [menuItems]);

  if (leftOrRightMenuItems.length === 0) {
    return null;
  }

  return (
    <ul className={clsx('rp-nav-menu', `rp-nav-menu--${position}`)}>
      {leftOrRightMenuItems.map((item, index) => {
        return <NavMenuItem key={index} menuItem={item} />;
      })}
    </ul>
  );
}
