import { Spin } from 'antd';
import React from 'react';
import { useApp } from './useApp';

export const useAppSpin = () => {
  const app = useApp();
  return {
    render: () => (app ? app?.renderComponent?.('AppSpin') : React.createElement(Spin)),
  };
};
