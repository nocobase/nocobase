import React from 'react';
import { Layout, Menu, Breadcrumb } from 'antd';
import { Link as UmiLink, useLocation } from 'umi';
import Icon from '@/components/icons';
import './style.less';

function pathcamp(path1: string, path2: string) {
  return true;
  if (path1 === path2) {
    return true;
  }
  return path1.indexOf(`${path2}/`) === 0;
}

function Link(props: any) {
  const { to, children } = props;
  if (/^http/.test(to)) {
    return <a target={'_blank'} href={to}>{children}</a>
  }
  return <UmiLink {...props}/>
}

export default (props: any) => {
  const { currentPageName, items = [], hideChildren, ...restProps } = props;
  const location = useLocation();
  let paths = items.map(item => item.path);
  if (items.length === 0) {
    return null;
  }
  const keys = items.filter(item => {
    if (item.path && item.path === currentPageName) {
      return true;
    }
    if (item.paths && item.paths.includes(currentPageName)) {
      return true;
    }
    return false;
  }).map(item => `${item.id}`);
  console.log({currentPageName, items, keys});
  return (
    <Menu
      selectedKeys={keys}
      openKeys={keys}
      {...restProps}
    >
      {items.map(item => {
        const { children = [] } = item;
        const subItems = children.filter(child => child.showInMenu);
        if (!hideChildren && subItems.length > 1) {
          return (
            <Menu.SubMenu key={`${item.id}`} icon={<Icon type={item.icon}/>} title={<>{item.title}</>}>
              {subItems.map((child: any) => (
                <Menu.Item key={`${child.id}`}>
                  <Link to={child.path}>{child.title}</Link>
                </Menu.Item>
              ))}
            </Menu.SubMenu>
          )
        }
        return (
          <Menu.Item icon={<Icon type={item.icon}/>} key={`${item.id}`}>
            <Link to={item.path}>{item.title}</Link>
          </Menu.Item>
        )
      })}
    </Menu>
  );
};
