import React from 'react';
import {
  createFromIconfontCN,
  UserOutlined,
  TeamOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  SettingOutlined,
  TableOutlined,
  MenuOutlined,
  HistoryOutlined,
  NotificationOutlined,
} from '@ant-design/icons';

export const IconFont = createFromIconfontCN({
  scriptUrl: [
    '//at.alicdn.com/t/font_2261954_u9jzwc44ug.js',
  ],
});

export const icons = new Map<string, any>();

export function registerIcon(type: string, icon: any = IconFont) {
  icons.set(type.toLowerCase(), icon);
}

export function hasIcon(type: string) {
  if (!type) {
    return false;
  }
  return icons.has(type.toLowerCase());
}

export function registerIcons(components) {
  Object.keys(components).forEach(type => {
    registerIcon(type, components[type]);
  });
}

registerIcons({
  HistoryOutlined,
  MenuOutlined,
  TableOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  NotificationOutlined,
});

interface IconProps {
  type: string;
  [key: string]: any;
}

export function Icon(props: IconProps) {
  const { type = '', ...restProps } = props;
  if (type && icons.has(type.toLowerCase())) {
    const IconComponent = icons.get(type.toLowerCase());
    if (IconComponent === IconFont) {
      return <IconFont type={type} />;
    }
    return <IconComponent {...restProps}/>;
  }
  return <IconFont type={type} />;
}

export default Icon;
