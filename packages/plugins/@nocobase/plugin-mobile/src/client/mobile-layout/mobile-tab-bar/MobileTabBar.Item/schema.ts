import { upperFirst } from 'lodash';
import { MobileRouteItem } from '../../../mobile-providers';

export function getMobileTabBarItemSchema(routeItem: MobileRouteItem) {
  return {
    name: routeItem.id,
    type: 'void',
    'x-decorator': 'BlockItem',
    'x-settings': `mobile:tab-bar:${routeItem.type}`,
    'x-component': `MobileTabBar.${upperFirst(routeItem.type)}`,
    'x-toolbar-props': {
      showBorder: false,
      showBackground: true,
    },
    'x-component-props': {
      title: routeItem.title,
      icon: routeItem.icon,
      schemaUid: routeItem.schemaUid,
      ...(routeItem.options || {}),
    },
  }
}
