/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MenuOutlined } from '@ant-design/icons';
import { css, useViewport } from '@nocobase/client';
import { Dropdown, Switch } from 'antd';
import { Badge, Button, Image, List, NavBar, SearchBar, Space, TabBar, Tabs } from 'antd-mobile';
import { AddOutline, AppOutline, EditSOutline, SearchOutline, UserOutline } from 'antd-mobile-icons';
import React, { useState } from 'react';

const users = [
  {
    id: '1',
    avatar:
      'https://images.unsplash.com/photo-1548532928-b34e3be62fc6?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
    name: 'Novalee Spicer',
    description: 'Deserunt dolor ea eaque eos',
  },
  {
    id: '2',
    avatar:
      'https://images.unsplash.com/photo-1493666438817-866a91353ca9?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9',
    name: 'Sara Koivisto',
    description: 'Animi eius expedita, explicabo',
  },
  {
    id: '3',
    avatar:
      'https://images.unsplash.com/photo-1542624937-8d1e9f53c1b9?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
    name: 'Marco Gregg',
    description: 'Ab animi cumque eveniet ex harum nam odio omnis',
  },
  {
    id: '4',
    avatar:
      'https://images.unsplash.com/photo-1546967191-fdfb13ed6b1e?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
    name: 'Edith Koenig',
    description: 'Commodi earum exercitationem id numquam vitae',
  },
  {
    id: '1',
    avatar:
      'https://images.unsplash.com/photo-1548532928-b34e3be62fc6?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
    name: 'Novalee Spicer',
    description: 'Deserunt dolor ea eaque eos',
  },
  {
    id: '2',
    avatar:
      'https://images.unsplash.com/photo-1493666438817-866a91353ca9?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9',
    name: 'Sara Koivisto',
    description: 'Animi eius expedita, explicabo',
  },
  {
    id: '3',
    avatar:
      'https://images.unsplash.com/photo-1542624937-8d1e9f53c1b9?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
    name: 'Marco Gregg',
    description: 'Ab animi cumque eveniet ex harum nam odio omnis',
  },
  {
    id: '4',
    avatar:
      'https://images.unsplash.com/photo-1546967191-fdfb13ed6b1e?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
    name: 'Edith Koenig',
    description: 'Commodi earum exercitationem id numquam vitae',
  },
  {
    id: '1',
    avatar:
      'https://images.unsplash.com/photo-1548532928-b34e3be62fc6?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
    name: 'Novalee Spicer',
    description: 'Deserunt dolor ea eaque eos',
  },
  {
    id: '2',
    avatar:
      'https://images.unsplash.com/photo-1493666438817-866a91353ca9?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9',
    name: 'Sara Koivisto',
    description: 'Animi eius expedita, explicabo',
  },
  {
    id: '3',
    avatar:
      'https://images.unsplash.com/photo-1542624937-8d1e9f53c1b9?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
    name: 'Marco Gregg',
    description: 'Ab animi cumque eveniet ex harum nam odio omnis',
  },
  {
    id: '4',
    avatar:
      'https://images.unsplash.com/photo-1546967191-fdfb13ed6b1e?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
    name: 'Edith Koenig',
    description: 'Commodi earum exercitationem id numquam vitae',
  },
  {
    id: '1',
    avatar:
      'https://images.unsplash.com/photo-1548532928-b34e3be62fc6?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
    name: 'Novalee Spicer',
    description: 'Deserunt dolor ea eaque eos',
  },
  {
    id: '2',
    avatar:
      'https://images.unsplash.com/photo-1493666438817-866a91353ca9?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9',
    name: 'Sara Koivisto',
    description: 'Animi eius expedita, explicabo',
  },
  {
    id: '3',
    avatar:
      'https://images.unsplash.com/photo-1542624937-8d1e9f53c1b9?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
    name: 'Marco Gregg',
    description: 'Ab animi cumque eveniet ex harum nam odio omnis',
  },
  {
    id: '4',
    avatar:
      'https://images.unsplash.com/photo-1546967191-fdfb13ed6b1e?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
    name: 'Edith Koenig',
    description: 'Commodi earum exercitationem id numquam vitae',
  },
];

const SwitchItem = ({ title, defaultChecked = false }) => {
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        justify-content: space-between;
      `}
    >
      <span>{title}</span> <Switch size={'small'} defaultChecked={defaultChecked} style={{ marginLeft: 20 }} />
    </div>
  );
};

const Add = (props) => {
  const { items = [], size = 'mini' } = props;
  return (
    <Dropdown
      menu={{
        items,
      }}
      trigger={['click']}
    >
      <Button
        size={size || 'mini'}
        style={{
          height: 25,
          padding: '3px 5px',
          border: '1px dashed #F18B62',
          color: '#F18B62',
          ...props.style,
        }}
      >
        <AddOutline /> {props.children}
      </Button>
    </Dropdown>
  );
};

const PageTabs = (props) => {
  if (props.hidden) {
    return null;
  }
  return (
    <div
      className={css`
        display: flex;
        flex-wrap: nowrap;
        justify-content: flex-start;
        align-items: center;
        position: relative;
        overflow: hidden;
        scrollbar-width: none;
      `}
    >
      <Tabs
        className={css`
          --adm-color-border: transparent;
          bottom: -1px;
          width: 100%;
          overflow: hidden;
        `}
        defaultActiveKey="1"
      >
        <Tabs.Tab title="Espresso" key="1"></Tabs.Tab>
        <Tabs.Tab title="Coffee Latte" key="2"></Tabs.Tab>
        <Tabs.Tab title="Cappuccino" key="3"></Tabs.Tab>
        <Tabs.Tab title="Americano" key="4"></Tabs.Tab>
        <Tabs.Tab title="Flat White" key="5"></Tabs.Tab>
        <Tabs.Tab title="Caramel Macchiato" key="6"></Tabs.Tab>
        <Tabs.Tab title="Cafe Mocha" key="7"></Tabs.Tab>
      </Tabs>
      <Add
        style={{
          margin: '0 12px',
        }}
        items={[
          { label: '空页面', key: 'o1' },
          { label: '列表页', key: 'o3' },
          { label: '表单页', key: 'o4' },
        ]}
      />
    </div>
  );
};

const PageSettings = ({ hideTabs = true }) => {
  return (
    <div
      className={css`
        position: absolute;
        right: 0;
        top: 0;
        z-index: 1000;
        color: #fff;
        line-height: 1em;
        font-size: 12px;
        &::before {
          content: ' ';
          position: fixed;
          top: 0;
          border: 1px solid rgb(241 139 98 / 60%);
          display: block;
          right: 0;
          left: 0;
          bottom: 0px;
          pointer-events: none;
        }
        &::after {
          content: ' ';
          position: absolute;
          top: 0;
          border: 12px solid rgb(241 139 98 / 60%);
          display: block;
          right: 0;
          border-bottom-color: transparent;
          border-left-color: transparent;
          pointer-events: none;
        }
      `}
    >
      <Dropdown
        menu={{
          items: [
            { label: <SwitchItem title={'启用导航栏'} defaultChecked />, key: 'o1' },
            { label: <SwitchItem title={'启用页面选项卡'} defaultChecked={!hideTabs} />, key: 'o2' },
            { label: <SwitchItem title={'启用底部标签栏'} defaultChecked />, key: 'o2' },
            {
              type: 'divider',
            },
            { label: '数据范围', key: 'o2' },
            { label: '排序规则', key: 'o2' },
          ],
        }}
        trigger={['click']}
      >
        <MenuOutlined
          className={css`
            color: #fff;
            position: relative;
            z-index: 1;
            vertical-align: 0 !important;
          `}
        />
      </Dropdown>
    </div>
  );
};
const Header = ({
  onBack = null,
  back = false,
  title = null,
  showTabs = false,
  showSearchBar = false,
  actions = [],
}) => {
  return (
    <div
      className={css`
        background: #fff;
        display: block;
        position: relative;
        -ms-flex-order: -1;
        order: -1;
        width: 100%;
        z-index: 10;
        border-bottom: solid 1px var(--adm-color-border);
        .adm-nav-bar-back {
          display: ${back ? 'flex' : 'none'};
        }
      `}
    >
      {/* <Dropdown
        menu={{
          items: actions,
        }}
        trigger={['contextMenu']}
      >
        <div> */}
      <NavBar
        onBack={onBack}
        back={back}
        backArrow={!!back}
        left={
          <Space style={{ '--gap': '16px' }}>
            {/* <SearchOutline style={{ fontSize: 24 }} /> */}
            <Add items={actions} />
          </Space>
        }
        right={
          <Space style={{ '--gap': '16px' }}>
            {actions.map((action) => action.right && action.active && action.element)}
            <Add items={actions} />
          </Space>
        }
      >
        {title}
      </NavBar>
      {/* </div>
      </Dropdown> */}
      {actions.map(
        (action, key) =>
          action.bottom &&
          action.active && (
            <div key={key} style={{ padding: '0 12px 12px' }}>
              {action.element}
            </div>
          ),
      )}
      {<PageTabs hidden={!showTabs} />}
    </div>
  );
};
const Footer = () => {
  const tabs = [
    {
      key: 'home',
      title: '首页',
      icon: <AppOutline />,
      badge: Badge.dot,
    },
    // {
    //   key: 'todo',
    //   title: '待办',
    //   icon: <UnorderedListOutline />,
    //   badge: '5',
    // },
    // {
    //   key: 'message',
    //   title: '消息',
    //   icon: (active: boolean) => (active ? <MessageFill /> : <MessageOutline />),
    //   badge: '99+',
    // },
    {
      key: 'personalCenter',
      title: '用户列表',
      icon: <UserOutline />,
    },
  ];
  return (
    <div
      className={css`
        display: block;
        position: relative;
        -ms-flex-order: 1;
        order: 1;
        width: 100%;
        z-index: 10;
        border-top: solid 1px var(--adm-color-border);
        background: #fff;
      `}
    >
      <Dropdown
        menu={{
          items: [
            { label: '启用导航栏', key: 'o1' },
            { label: '启用页面选项卡', key: 'o2' },
            { label: '启用底部标签栏', key: 'o2' },
          ],
        }}
        trigger={['contextMenu']}
      >
        <div
          className={css`
            display: flex;
            flex-wrap: nowrap;
            justify-content: flex-start;
            align-items: center;
            position: relative;
            overflow-x: scroll;
            scrollbar-width: none;
          `}
        >
          <TabBar defaultActiveKey={'personalCenter'} style={{ width: '100%' }}>
            {tabs.map((item) => (
              <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
            ))}
          </TabBar>
          <Add
            style={{
              marginRight: 12,
            }}
            items={[
              { label: '空页面', key: 'o1' },
              { label: '列表页', key: 'o3' },
              { label: '表单页', key: 'o4' },
              {
                type: 'divider',
              },
              { label: '链接', key: 'o2' },
              { label: '扫码', key: 'o5' },
            ]}
          />
        </div>
      </Dropdown>
    </div>
  );
};

const Page = (props) => {
  return (
    <div
      className={css`
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        display: flex;
        position: absolute;
        flex-direction: column;
        justify-content: space-between;
        contain: layout size style;
        z-index: 0;
        background: #f5f5f5;
        // border: 1px solid rgb(241 139 98 / 60%);
        overflow: hidden;
      `}
    >
      <PageSettings />
      {props.children}
    </div>
  );
};

Page.Content = (props) => {
  return (
    <div
      className={css`
        height: ${props.showFooter ? 'calc(100vh - 95px)' : 'calc(100vh - 45px)'};
        overflow-y: auto;
        margin-top: -1px;
      `}
    >
      {props.children}
    </div>
  );
};

const MApplication: React.FC = (props) => {
  useViewport();
  const showTabs = false || !!props['showTabs'];
  const [active, setActive] = useState(false);
  return (
    <Page>
      <PageSettings />
      <Header
        onBack={() => setActive(false)}
        back={active}
        title={active ? 'Novalee Spicer' : '首页'}
        showTabs={showTabs}
        actions={
          active
            ? [
                {
                  label: '编辑',
                  right: true,
                  element: <EditSOutline style={{ fontSize: 24 }} />,
                  key: 'o1',
                  active: active,
                },
              ]
            : [
                {
                  label: <SwitchItem title={'标题'} defaultChecked />,
                  key: 'o1',
                  active: !active,
                },
                {
                  label: '筛选',
                  right: true,
                  element: <SearchOutline style={{ fontSize: 24 }} />,
                  key: 'o1',
                  active: !active,
                },
                {
                  label: '搜索框',
                  bottom: true,
                  element: <SearchBar placeholder="请输入内容" />,
                  key: 'o1',
                  // active: true,
                },
                { label: '动作面板', key: 'o3' },
                { label: '弹出层', key: 'o3' },
                { label: '链接', key: 'o2' },
                { label: '扫码', key: 'o4' },
                { label: '菜单', key: 'o4' },
              ]
        }
      />
      <Page.Content showFooter={!active}>
        {active ? (
          <div
            className={css`
              padding: 12px;
              background: #fff;
              img {
                max-width: 100%;
              }
            `}
            dangerouslySetInnerHTML={{
              __html: `
        <h1>Novalee Spicer</h1>

        <h2>Rhinoceros</h2>
        <img alt="rhino standing near grass" src="https://images.unsplash.com/flagged/photo-1556983257-71fddc36bc75?ixlib=rb-1.2.1&amp;ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&amp;auto=format&amp;fit=crop&amp;w=1742&amp;q=80">
        <p>
          The rhinoceros gets its name from one of its most notable features: its horns. The word rhinoceros come from
          the Greek words rhino meaning “nose” and ceros meaning “horn.” The number of horns that a rhino has varies on
          the species. The two African species (the black rhino and the white rhino) and the Sumatran rhino have two
          horns, while the Javan rhino and one-horned rhino have one horn.
        </p>

        <h2>Sea Turtle</h2>
        <img alt="brown sea turtle in water" src="https://images.unsplash.com/photo-1573551089778-46a7abc39d9f?ixlib=rb-1.2.1&amp;ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&amp;auto=format&amp;fit=crop&amp;w=1974&amp;q=80">
        <p>
          Sea turtles are characterized by a large, streamlined shell and non-retractile head and limbs. Unlike other
          turtles, sea turtles cannot pull their limbs and head inside their shells. Their limbs are flippers that are
          adapted for swimming, so they are vulnerable while on land.
        </p>

        <h2>Giraffe</h2>
        <img alt="giraffe sticking its tongue out" src="https://images.unsplash.com/photo-1577114995803-d8ce0e2b4aa9?ixlib=rb-1.2.1&amp;ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&amp;auto=format&amp;fit=crop&amp;w=1746&amp;q=80">
        <p>
          Giraffes are known for their long, tall appearance. They have a small hump on their back like a camel and have
          a spotted pattern similar to that of a leopard. Because of the combination of these features, some people
          called the giraffe a “camel-leopard.” That’s where the giraffe’s species name “camelopardalis” comes from.
        </p>

        <h2>Elephant</h2>
        <img alt="two grey elephants on grass plains during sunset" src="https://images.unsplash.com/photo-1564760055775-d63b17a55c44?ixlib=rb-1.2.1&amp;ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&amp;auto=format&amp;fit=crop&amp;w=1754&amp;q=80">
        <p>
          Elephants are the largest existing land animal, with massive bodies, large ears, and long trunks. Elephants’
          long trunks are multifunctional. They are used to pick up objects, trumpet warnings, greet other elephants, or
          suck up water for drinking or bathing.
        </p>

        <h2>Dolphin</h2>
        <img alt="black and white dolphin in water" src="https://images.unsplash.com/photo-1607153333879-c174d265f1d2?ixlib=rb-1.2.1&amp;ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&amp;auto=format&amp;fit=crop&amp;w=1742&amp;q=80">
        <p>
          Dolphins range in color depending on the species, from white, pearl, and pink to darker shades of brown, gray,
          blue, and black. They have smooth skin, flippers, and a dorsal fin. They have a long, slender snout with about
          100 teeth and a streamlined body. They have a single blowhole on top of their head, which has a flap that
          opens to reveal a pair of nostrils. The dolphin uses these nostrils for breathing when it surfaces.
        </p>
        `,
            }}
          />
        ) : (
          false && (
            <List>
              {users.map((user) => (
                <List.Item
                  key={user.name}
                  prefix={<Image src={user.avatar} style={{ borderRadius: 20 }} fit="cover" width={40} height={40} />}
                  description={user.description}
                  onClick={() => setActive(true)}
                >
                  {user.name}
                </List.Item>
              ))}
            </List>
          )
        )}

        <Add
          style={{
            margin: 12,
            height: 'auto',
          }}
          size={'small'}
          items={[
            { label: '空页面', key: 'o1' },
            { label: '列表页', key: 'o3' },
            { label: '表单页', key: 'o4' },
            {
              type: 'divider',
            },
            { label: '链接', key: 'o2' },
            { label: '扫码', key: 'o5' },
          ]}
        >
          Add block
        </Add>
      </Page.Content>
      {!active && <Footer />}
    </Page>
  );
};

export default MApplication;
