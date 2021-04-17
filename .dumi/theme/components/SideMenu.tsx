import type { FC} from 'react';
import React, { useContext } from 'react';
import { context, Link, NavLink } from 'dumi/theme';
import LocaleSelect from './LocaleSelect';
import SlugList from './SlugList';
import './SideMenu.less';

interface INavbarProps {
  mobileMenuCollapsed: boolean;
  location: any;
}

const SideMenu: FC<INavbarProps> = ({ mobileMenuCollapsed, location }) => {
  const {
    config: {
      logo,
      title,
      description,
      mode,
      repository: { url: repoUrl },
    },
    menu,
    nav: navItems,
    base,
    meta,
  } = useContext(context);
  const isHiddenMenus =
    Boolean((meta.hero || meta.features || meta.gapless) && mode === 'site') ||
    meta.sidemenu === false ||
    undefined;

  return (
    <div
      className="__dumi-default-menu"
      data-mode={mode}
      data-hidden={isHiddenMenus}
      data-mobile-show={!mobileMenuCollapsed || undefined}
    >
      <div className="__dumi-default-menu-inner">
        <div className="__dumi-default-menu-header">
          <Link
            to={base}
            className="__dumi-default-menu-logo"
            style={{
              backgroundImage: logo && `url('${logo}')`,
            }}
          />
          <h1>{title}</h1>
          <p>{description}</p>
          {/* github star badge */}
          {/github\.com/.test(repoUrl) && mode === 'doc' && (
            <p>
              <object
                type="image/svg+xml"
                data={`https://img.shields.io/github/stars${
                  repoUrl.match(/((\/[^\/]+){2})$/)[1]
                }?style=social`}
              />
            </p>
          )}
        </div>
        {/* mobile nav list */}
        {navItems.length ? (
          <div className="__dumi-default-menu-mobile-area">
            <ul className="__dumi-default-menu-nav-list">
              {navItems.map(nav => {
                const child = Boolean(nav.children?.length) && (
                  <ul>
                    {nav.children.map(item => (
                      <li key={item.path || item.title}>
                        <NavLink to={item.path}>{item.title}</NavLink>
                      </li>
                    ))}
                  </ul>
                );

                return (
                  <li key={nav.path || nav.title}>
                    {nav.path ? <NavLink to={nav.path}>{nav.title}</NavLink> : nav.title}
                    {child}
                  </li>
                );
              })}
            </ul>
            {/* site mode locale select */}
            <LocaleSelect location={location} />
          </div>
        ) : (
          <div className="__dumi-default-menu-doc-locale">
            {/* doc mode locale select */}
            <LocaleSelect location={location} />
          </div>
        )}
        {/* menu list */}
        <ul className="__dumi-default-menu-list">
          {!isHiddenMenus &&
            menu.map(item => {
              // always use meta from routes to reduce menu data size
              const hasSlugs = Boolean(meta.slugs?.length);
              const hasChildren = item.children && Boolean(item.children.length);
              const show1LevelSlugs =
                meta.toc === 'menu' && !hasChildren && hasSlugs && item.path === location.pathname.replace(/([^^])\/$/, '$1');

              return (
                <li key={item.path || item.title}>
                  <NavLink to={item.path} exact={!(item.children && item.children.length)}>
                    {item.title}
                  </NavLink>
                  {/* group children */}
                  {Boolean(item.children && item.children.length) && (
                    <ul>
                      {item.children.map(child => (
                        <li key={child.path}>
                          <NavLink to={child.path} exact>
                            <span>{child.title}</span>
                          </NavLink>
                          {/* group children slugs */}
                          {Boolean(
                            meta.toc === 'menu' &&
                              typeof window !== 'undefined' &&
                              child.path === location.pathname &&
                              hasSlugs,
                          ) && <SlugList slugs={meta.slugs} />}
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* group slugs */}
                  {show1LevelSlugs && <SlugList slugs={meta.slugs} />}
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
};

export default SideMenu;
