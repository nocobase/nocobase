import { uid } from '@formily/shared';
import { ISchema } from '..';

export function generateDefaultSchema(component) {
  const defaultSchemas: { [key: string]: ISchema } = {
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
          async: true,
          'x-component': 'Page',
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Grid',
              'x-component-props': {
                addNewComponent: 'AddNew.CardItem',
              },
            },
          },
        },
      },
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
  return defaultSchemas[component];
}
