import React, { useState } from 'react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Input, Popover, Button } from 'antd';
import { LoadingOutlined, CloseOutlined } from '@ant-design/icons';
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

import * as antIcons from '@ant-design/icons';

export const IconFont = createFromIconfontCN({
  scriptUrl: ['//at.alicdn.com/t/font_2261954_u9jzwc44ug.js'],
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
  Object.keys(components).forEach((type) => {
    registerIcon(type, components[type]);
  });
}

Object.keys(antIcons).forEach((name) => {
  if (name.endsWith('Outlined')) {
    registerIcon(name, antIcons[name]);
  }
});

registerIcons({
  // HistoryOutlined,
  // MenuOutlined,
  // TableOutlined,
  // SettingOutlined,
  // TeamOutlined,
  // UserOutlined,
  // DatabaseOutlined,
  // DashboardOutlined,
  // NotificationOutlined,
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
    return <IconComponent {...restProps} />;
  }
  return <IconFont type={type} />;
}

function IconField(props: any) {
  const { value, onChange } = props;
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <Input.Group compact>
        <Popover
          placement={'bottom'}
          visible={visible}
          onVisibleChange={(val) => {
            setVisible(val);
          }}
          content={
            <div
              style={{ width: '26em', maxHeight: '20em', overflowY: 'auto' }}
            >
              {[...icons.keys()].map((key) => (
                <span
                  style={{ fontSize: 18, marginRight: 10, cursor: 'pointer' }}
                  onClick={() => {
                    onChange(key);
                    setVisible(false);
                  }}
                >
                  <Icon type={key} />
                </span>
              ))}
            </div>
          }
          title="图标"
          trigger="click"
        >
          <Button>{hasIcon(value) ? <Icon type={value} /> : '选择图标'}</Button>
        </Popover>
        {value && (
          <Button
            icon={<CloseOutlined />}
            onClick={(e) => {
              onChange(null);
            }}
          ></Button>
        )}
      </Input.Group>
    </div>
  );
}

export const IconPicker = connect(
  IconField,
  mapProps((props, field) => {
    return {
      ...props,
      suffix: (
        <span>
          {field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffix
          )}
        </span>
      ),
    };
  }),
  mapReadPretty((props) => {
    return <Icon type={props.value} />;
  }),
);

export default IconPicker;
