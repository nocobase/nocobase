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
} from '@ant-design/icons';

const IconFont = createFromIconfontCN({
  scriptUrl: [
    '//at.alicdn.com/t/font_2261954_u9jzwc44ug.js',
  ],
});

const icons = new Map<string, any>();

export function registerIcon(type: string, icon) {
  icons.set(type.toLowerCase(), icon);
}

export function registerIcons(components) {
  Object.keys(components).forEach(type => {
    registerIcon(type, components[type]);
  });
}

registerIcons({
  MenuOutlined,
  TableOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  DatabaseOutlined,
  DashboardOutlined,
});

interface IconProps {
  type: string;
  [key: string]: any;
}

export function Icon(props: IconProps) {
  const { type = '', ...restProps } = props;
  if (type && icons.has(type.toLowerCase())) {
    const IconComponent = icons.get(type.toLowerCase());
    return <IconComponent {...restProps}/>;
  }
  return <IconFont type={type} />;
}

export default Icon;
