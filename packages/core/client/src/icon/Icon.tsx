import * as antIcons from '@ant-design/icons';
import AntdIcon, { createFromIconfontCN } from '@ant-design/icons';
import React from 'react';

let IconFont: any;

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
  Object.keys(components).forEach((type) => {
    registerIcon(type, components[type]);
  });
}

Object.keys(antIcons).forEach((name) => {
  if (name.endsWith('Outlined')) {
    registerIcon(name, antIcons[name]);
  }
});

interface IconProps {
  type: string;
  component?: any;
  [key: string]: any;
}

export const Icon = (props: IconProps) => {
  const { type = '', component, ...restProps } = props;
  if (component) {
    return <AntdIcon component={component} {...restProps} />;
  }
  if (type && icons.has(type.toLowerCase())) {
    const IconComponent = icons.get(type.toLowerCase());
    return <IconComponent {...restProps} />;
  }
  if (type && IconFont) {
    return <IconFont type={type} />;
  }
  return null;
};

Icon.createFromIconfontCN = (options) => {
  IconFont = createFromIconfontCN(options);
};

Icon.register = (icons?: any) => {
  registerIcons(icons);
};

export default Icon;
