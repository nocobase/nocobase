import { uid } from '@formily/shared';

export default {
  type: 'void',
  name: `menu_${uid()}`,
  'x-component': 'Menu',
  'x-designable-bar': 'Menu.DesignableBar',
  'x-component-props': {
    mode: 'mix',
    theme: 'dark',
    defaultSelectedKeys: '{{ selectedKeys }}',
    sideMenuRef: '{{ sideMenuRef }}',
    onSelect: '{{ onSelect }}',
  },
  properties: {
    [uid()]: {
      type: 'void',
      title: `菜单2`,
      'x-component': 'Menu.Link',
      'x-component-props': {
        icon: 'MailOutlined',
      },
    },
    [uid()]: {
      type: 'void',
      title: `菜单22`,
      'x-component': 'Menu.Link',
      'x-component-props': {
        icon: 'AppstoreOutlined',
        // url: 'https://www.google.com',
      },
    },
    [uid()]: {
      type: 'void',
      title: '菜单组1',
      'x-component': 'Menu.SubMenu',
      'x-component-props': {
        icon: 'SettingOutlined',
      },
    },
    [uid()]: {
      type: 'void',
      title: '菜单组2',
      'x-component': 'Menu.SubMenu',
      'x-component-props': {
        icon: 'SettingOutlined',
      },
      properties: {
        [uid()]: {
          type: 'void',
          title: '菜单6',
          'x-component': 'Menu.SubMenu',
          'x-component-props': {
            icon: 'AppstoreOutlined',
          },
          properties: {
            [uid()]: {
              type: 'void',
              title: '菜单9',
              'x-component': 'Menu.SubMenu',
              properties: {
                [uid()]: {
                  type: 'void',
                  title: `子菜单10`,
                  'x-component': 'Menu.Link',
                },
                [uid()]: {
                  type: 'void',
                  title: `子菜单11`,
                  'x-component': 'Menu.Link',
                },
              }
            },
            [uid()]: {
              type: 'void',
              title: `子菜单7`,
              'x-component': 'Menu.Link',
            },
            [uid()]: {
              type: 'void',
              title: `子菜单8`,
              'x-component': 'Menu.Link',
            },
          }
        },
        [uid()]: {
          type: 'void',
          title: `子菜单1`,
          'x-component': 'Menu.Link',
        },
        [uid()]: {
          type: 'void',
          title: `子菜单2`,
          'x-component': 'Menu.Link',
        },
      }
    },
    [uid()]: {
      type: 'void',
      title: `菜单1`,
      'x-component': 'Menu.Link',
      'x-component-props': {
        icon: 'SettingOutlined',
      },
    },
  },
}