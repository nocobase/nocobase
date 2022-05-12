import { Menu } from 'antd';
import 'antd/dist/antd.css';
import { context, Link, NavLink } from 'dumi/theme';
import type { FC } from 'react';
import React, { useContext } from 'react';
import LocaleSelect from './LocaleSelect';
import './SideMenu.less';

interface INavbarProps {
  mobileMenuCollapsed: boolean;
  location: any;
  darkPrefix?: React.ReactNode;
}

const SideMenu: FC<INavbarProps> = ({ mobileMenuCollapsed, location, darkPrefix }) => {
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
    Boolean((meta.hero || meta.features || meta.gapless) && mode === 'site') || meta.sidemenu === false || undefined;
  console.log(JSON.stringify(menu, null, 2));
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
                data={`https://img.shields.io/github/stars${repoUrl.match(/((\/[^\/]+){2})$/)[1]}?style=social`}
              />
            </p>
          )}
        </div>
        {/* mobile nav list */}

        <div className="__dumi-default-menu-mobile-area">
          {!!navItems.length && (
            <ul className="__dumi-default-menu-nav-list">
              {navItems.map((nav) => {
                const child = Boolean(nav.children?.length) && (
                  <ul>
                    {nav.children.map((item) => (
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
          )}
          {/* site mode locale select */}
          <LocaleSelect location={location} />
          {darkPrefix}
        </div>
        {/* menu list */}
        <div className="__dumi-default-menu-list22">
          <Menu mode={'inline'} selectedKeys={[location.pathname]}>
            {menu.map((item) => {
              if (!item.path) {
                return (
                  <Menu.ItemGroup title={item.title} key={item.title}>
                    {item?.children?.map((child) => {
                      return (
                        <Menu.Item eventKey={child.path}>
                          <NavLink to={child.path}>{child.title}</NavLink>
                        </Menu.Item>
                      );
                    })}
                  </Menu.ItemGroup>
                );
              }
              return (
                <Menu.Item eventKey={item.path}>
                  <NavLink to={item.path}>{item.title}</NavLink>
                </Menu.Item>
              );
            })}
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
