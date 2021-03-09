import React, { useState } from 'react';
import { Layout, Dropdown, Avatar, Drawer } from 'antd';
import './style.less';
import { history, Link, request, useModel } from 'umi';
import { UserOutlined, CodeOutlined, MenuOutlined } from '@ant-design/icons';
import AvatarDropdown from '@/components/pages/AvatarDropdown';
import Menu from '../menu';
import { ReactComponent as Logo } from './logo-white.svg';
import { useResponsive, useLocalStorageState } from 'ahooks';

export function TopMenuLayout(props: any) {
  const { currentPageName, menu = [] } = props;
  console.log({menu})
  // const [visible, setVisible] = useState(false);
  const [visible, setVisible] = useLocalStorageState(`nocobase-nav-visible`, false);
  const responsive = useResponsive();
  const isMobile = responsive.small && !responsive.middle && !responsive.large;
  return (
    <Layout style={{ height: '100vh' }}>
      <Layout.Header style={{height: 48, lineHeight: '48px', padding: 0}} className="nb-header">
        <div className="logo" style={{width: 200, height: 20, float: 'left'}}><Logo/></div>
        {!isMobile && <Menu currentPageName={currentPageName} hideChildren={true} items={menu} className={'noco-top-menu'} style={{float: 'left'}} theme="dark" mode="horizontal"/>}
        {!isMobile && <AvatarDropdown/>}
        {isMobile && <MenuOutlined onClick={() => {
          setVisible(true);
        }} style={{
          fontSize: 16, 
          color: '#fff',
          position: 'absolute',
          right: 16,
          top: 16,
        }}/>}
        {isMobile && <Drawer visible={visible} onClose={() => {
          setVisible(false);
        }} placement={'right'} closable={false} bodyStyle={{background: '#001529', padding: 0}}>
          <Menu currentPageName={currentPageName} onSelect={() => {
            setVisible(false);
          }} mode={'inline'}  hideChildren={true} items={menu} className={'noco-top-menu'} style={{float: 'left'}} theme="dark"/>
          <AvatarDropdown/>
        </Drawer>}
      </Layout.Header>
      <Layout.Content>
        {props.children}
      </Layout.Content>
    </Layout>
  );
};

export default TopMenuLayout;
