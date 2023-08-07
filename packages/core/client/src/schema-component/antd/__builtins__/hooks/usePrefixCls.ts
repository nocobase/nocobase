import { ConfigProvider } from 'antd';
import { useContext } from 'react';

export const usePrefixCls = (
  tag?: string,
  props?: {
    prefixCls?: string;
  },
) => {
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext) || {};
  if ('ConfigContext' in ConfigProvider) {
    return getPrefixCls?.(tag, props?.prefixCls) || '';
  } else {
    const prefix = props?.prefixCls ?? 'ant-';
    return `${prefix}${tag ?? ''}`;
  }
};
