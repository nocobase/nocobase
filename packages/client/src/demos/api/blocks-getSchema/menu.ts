import { uid } from '@formily/shared';

export default {
  type: 'void',
  name: `m_${uid()}`,
  'x-component': 'Menu',
  'x-decorator': 'Menu.Designable',
  'x-component-props': {
  },
  properties: {
    item2: {
      type: 'void',
      title: `菜单2`,
      'x-component': 'Menu.Link',
      'x-component-props': {
        icon: 'MailOutlined',
      },
    },
    item22: {
      type: 'void',
      title: `菜单22`,
      'x-component': 'Menu.Link',
      'x-component-props': {
        icon: 'AppstoreOutlined',
        // url: 'https://www.google.com',
      },
    },
    item3: {
      type: 'void',
      title: '菜单组',
      'x-component': 'Menu.SubMenu',
      'x-component-props': {
        icon: 'SettingOutlined',
      },
      properties: {
        item6: {
          type: 'void',
          title: '菜单6',
          'x-component': 'Menu.SubMenu',
          'x-component-props': {
            icon: 'AppstoreOutlined',
          },
          properties: {
            item9: {
              type: 'void',
              title: '菜单9',
              'x-component': 'Menu.SubMenu',
              properties: {
                item10: {
                  type: 'void',
                  title: `子菜单10`,
                  'x-component': 'Menu.Link',
                  // properties: {
                  //   action1: {
                  //     type: 'void',
                  //     title: '页面标题2',
                  //     'x-component': 'Action.Page',
                  //   },
                  // },
                },
                item11: {
                  type: 'void',
                  title: `子菜单11`,
                  'x-component': 'Menu.Link',
                },
              }
            },
            item7: {
              type: 'void',
              title: `子菜单7`,
              'x-component': 'Menu.Link',
            },
            item8: {
              type: 'void',
              title: `子菜单8`,
              'x-component': 'Menu.Link',
            },
          }
        },
        item4: {
          type: 'void',
          title: `子菜单1`,
          'x-component': 'Menu.Link',
        },
        item5: {
          type: 'void',
          title: `子菜单2`,
          'x-component': 'Menu.Link',
        },
      }
    },
    item1: {
      type: 'void',
      title: `菜单1`,
      'x-component': 'Menu.Link',
      'x-component-props': {
        icon: 'SettingOutlined',
      },
    },
  },
}