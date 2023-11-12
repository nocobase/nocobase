import { Divider, theme } from 'antd';
import React from 'react';

export const SchemaInitializerDivider = () => {
  const { token } = theme.useToken();
  return <Divider style={{ marginTop: token.marginXXS, marginBottom: token.marginXXS }} />;
};
