import { PlusOutlined } from '@ant-design/icons';
import { useToken } from '@nocobase/client';
import { Button } from 'antd';
import React, { useCallback } from 'react';
import { useThemeEditorContext } from './ThemeEditorProvider';

const ToEditTheme = () => {
  const { token } = useToken();
  const { setOpen } = useThemeEditorContext();

  const handleClick = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  return (
    <Button
      type={'dashed'}
      style={{
        width: 240,
        height: 240,
        borderRadius: token.borderRadiusLG,
        borderColor: '#f18b62',
        color: '#f18b62',
      }}
      icon={<PlusOutlined />}
      onClick={handleClick}
    >
      Add New Theme
    </Button>
  );
};

ToEditTheme.displayName = 'ToEditTheme';

export default ToEditTheme;
