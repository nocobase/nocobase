import React from 'react';
import { Layout, Menu, Breadcrumb } from 'antd';
import { Link, useLocation } from 'umi';
import Icon from '@/components/icons';
import './style.less';

function pathcamp(path1: string, path2: string) {
  if (path1 === path2) {
    return true;
  }
  return path1.indexOf(`${path2}/`) === 0;
}

export default (props: any) => {
  const { items = [], hideChildren, ...restProps } = props;
  const location = useLocation();
  let paths = items.map(item => item.path);
  if (items.length === 0) {
    return null;
  }
  return (
    <Menu
      defaultSelectedKeys={paths
        .filter(path => pathcamp(location.pathname, path))
        .concat(location.pathname)}
      defaultOpenKeys={paths
        .filter(path => pathcamp(location.pathname, path))
        .concat(location.pathname)}
      {...restProps}
    >
      {items.map(item => {
        if (!item.showInMenu) {
          return null;
        }
        const { children = [] } = item;
        const subItems = children.filter(child => child.showInMenu);
        if (!hideChildren && subItems.length > 1) {
          return (
            <Menu.SubMenu
              key={`${item.path}`}
              icon={<Icon type={item.icon} />}
              title={<>{item.title}</>}
            >
              {subItems.map((child: any) => (
                <Menu.Item key={child.path}>
                  <Link to={child.path}>{child.title}</Link>
                </Menu.Item>
              ))}
            </Menu.SubMenu>
          );
        }
        return (
          <Menu.Item icon={<Icon type={item.icon} />} key={item.path}>
            <Link to={item.path}>{item.title}</Link>
          </Menu.Item>
        );
      })}
    </Menu>
  );
};
