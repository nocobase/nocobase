import React, { useState } from 'react';
import { Layout, Breadcrumb, Drawer } from 'antd';
import { Link } from 'umi';
import './style.less';
import Menu from '../menu';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useLocalStorageState } from 'ahooks';
import { useResponsive } from 'ahooks';

export function SideMenuLayout(props: any) {
  const { currentPageName, menu = [], menuId } = props;
  const [visible, setVisible] = useState(false);
  // console.log(menu);
  const [collapsed, setCollapsed] = useLocalStorageState(`nocobase-menu-collapsed-${menuId}`, false);
  const responsive = useResponsive();
  const isMobile = responsive.small && !responsive.middle && !responsive.large;
  document.body.className = collapsed ? 'collapsed' : '';
  return (
    <Layout style={{height: 'calc(100vh - 48px)'}}>
      {!isMobile && <Layout.Sider className={`nb-sider${collapsed ? ' collapsed' : ''}`} theme={'light'}>
        <Menu menuId={menuId} currentPageName={currentPageName} items={menu} mode={'inline'}/>
        <div onClick={() => {
          setCollapsed(!collapsed);
          setVisible(true);
          document.body.className = collapsed ? 'collapsed' : '';
        }} className={'menu-toggle'}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            style: { fontSize: 16 },
          })}
        </div>
      </Layout.Sider>}
      <Layout.Content id={'content'}>
        {props.children}
        {isMobile && <Drawer visible={visible} onClose={() => {
          setCollapsed(!collapsed);
          setVisible(false);
          document.body.className = collapsed ? 'collapsed' : '';
        }} placement={'left'} closable={false} bodyStyle={{padding: 0}}>
          <Menu onSelect={() => {
            setCollapsed(false);
            setVisible(false);
            document.body.className = collapsed ? 'collapsed' : '';
          }} currentPageName={currentPageName} menuId={menuId} items={menu} mode={'inline'}/>
        </Drawer>}
        {isMobile && <div onClick={() => {
          setCollapsed(!collapsed);
          setVisible(true);
          document.body.className = collapsed ? 'collapsed' : '';
        }} className={'menu-toggle'}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            style: { fontSize: 16 },
          })}
        </div>}
      </Layout.Content>
    </Layout>
  );
};

export default SideMenuLayout;
