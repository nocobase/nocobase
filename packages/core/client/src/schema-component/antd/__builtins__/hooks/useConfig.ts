import { ConfigProvider } from 'antd';
import { useContext } from 'react';

const { ConfigContext } = ConfigProvider;
export const useConfig = () => useContext(ConfigContext);
