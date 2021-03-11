import React, { useEffect, useState } from 'react';
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
  const { menuId, currentPageName, items = [], hideChildren, ...restProps } = props;
  if (items.length === 0) {
    return null;
  }
  const toPaths = (data) => {
    const paths = [];
    data.forEach(item => {
      if (item.path && item.path === currentPageName) {
        paths.push(`${item.name}`);
      }
      if (item.paths && item.paths.includes(currentPageName)) {
        paths.push(`${item.name}`);
      }
      paths.push(...toPaths(item.children||[]));
    });
    return paths;
  }
  const keys = toPaths(items);
  console.log({menuId, currentPageName, items, keys});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    });
  }, [menuId]);
  if (loading) {
    return null;
  }
  const renderChildren = (items) => {
    return items.map(item => {
      const { children = [] } = item;
      // const subItems = children.filter(child => child.showInMenu);
      if (!hideChildren && children.length) {
        return (
          <Menu.SubMenu key={`${item.name}`} icon={item.icon && <Icon type={item.icon}/>} title={<>{item.title}</>}>
            {renderChildren(children)}
          </Menu.SubMenu>
        )
      }
      return (
        <Menu.Item icon={item.icon && <Icon type={item.icon}/>} key={`${item.name}`}>
          <Link to={item.path}>{item.title}</Link>
        </Menu.Item>
      )
    })
  }
  return (
    <Menu
      defaultSelectedKeys={keys}
      defaultOpenKeys={keys}
      // selectedKeys={keys}
      // openKeys={keys}
      onOpenChange={(openKeys) => {
        console.log({openKeys});
      }}
      onSelect={(info) => {
        console.log({info});
      }}
      onDeselect={(info) => {
        console.log({info});
      }}
      {...restProps}
    >
      {renderChildren(items)}
    </Menu>
  );
};
