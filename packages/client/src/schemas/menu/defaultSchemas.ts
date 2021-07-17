import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

export const defaultSchemas = {
  MixMenu: {
    type: 'void',
    'x-component': 'Menu',
    'x-designable-bar': 'Menu.DesignableBar',
    'x-component-props': {
      sideMenuRef: '{{ sideMenuRef }}',
      mode: 'mix',
      theme: 'dark',
      // onSelect: '{{ onSelect }}',
    },
  },
  'Menu.Item': {
    type: 'void',
    'x-designable-bar': 'Menu.DesignableBar',
    'x-component': 'Menu.Item',
  },
  'Menu.Link': {
    type: 'void',
    'x-designable-bar': 'Menu.DesignableBar',
    'x-component': 'Menu.Link',
    properties: {
      [uid()]: {
        type: 'void',
        name: uid(),
        'x-component': 'Grid',
        properties: {
          [`row_${uid()}`]: {
            type: 'void',
            'x-component': 'Grid.Row',
            'x-component-props': {
              locked: true,
            },
            properties: {
              [`col_${uid()}`]: {
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  [uid()]: {
                    type: 'void',
                    'x-component': 'AddNew.BlockItem',
                  },
                },
              },
            },
          },
        },
      }
    }
  },
  'Menu.URL': {
    type: 'void',
    'x-designable-bar': 'Menu.DesignableBar',
    'x-component': 'Menu.URL',
  },
  'Menu.SubMenu': {
    type: 'void',
    'x-designable-bar': 'Menu.DesignableBar',
    'x-component': 'Menu.SubMenu',
  },
  'Menu.Action': {
    type: 'void',
    'x-designable-bar': 'Menu.DesignableBar',
    'x-component': 'Menu.Action',
  },
};

export default defaultSchemas;
