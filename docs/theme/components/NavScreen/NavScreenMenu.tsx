import type { NavItem } from '@rspress/core';
import { NavScreenMenuItem } from './NavScreenMenuItem';
import './NavScreenMenu.scss';

export function NavScreenMenu({ menuItems }: { menuItems: NavItem[] }) {
  return (
    <>
      {menuItems.map((item, index) => (
        <NavScreenMenuItem menuItem={item} key={index} />
      ))}
    </>
  );
}
