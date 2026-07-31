/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { theme } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import React, { useMemo } from 'react';

export type DocumentationPreviewShellProps = {
  children: ReactNode;
};

const DocumentationPreviewShell = ({ children }: DocumentationPreviewShellProps) => {
  const { token } = theme.useToken();
  const containerStyle = useMemo<CSSProperties>(
    () => ({
      background: token.colorBgContainer,
      borderRadius: token.borderRadiusLG,
      padding: token.paddingLG,
    }),
    [token.borderRadiusLG, token.colorBgContainer, token.paddingLG],
  );

  return <div style={containerStyle}>{children}</div>;
};

export default DocumentationPreviewShell;
