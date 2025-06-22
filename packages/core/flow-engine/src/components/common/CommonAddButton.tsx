/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

// TODO: 不知道什么原因，直接用该组件作为 Dropdown 的 children 会导致不显示下拉列表
export const CommonAddButton: FC<{ icon?: React.ReactNode }> = ({ icon = <PlusOutlined />, children }) => {
  return (
    <Button
      type="dashed"
      icon={icon}
      style={{
        borderColor: 'var(--colorSettings)',
        color: 'var(--colorSettings)',
      }}
    >
      {children}
    </Button>
  );
};

/**
 * TODO: 等解决 CommonAddButton 的问题之后，改用 CommonAddButton
 * @deprecated
 * @param param0
 * @returns
 */
export const getCommonAddButton = ({
  icon = <PlusOutlined />,
  children,
  onClick,
}: {
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <Button
      type="dashed"
      icon={icon}
      style={{
        borderColor: 'var(--colorSettings)',
        color: 'var(--colorSettings)',
      }}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};
