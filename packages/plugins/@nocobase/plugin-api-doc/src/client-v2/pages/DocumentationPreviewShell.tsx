/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RightOutlined } from '@ant-design/icons';
import { Button, Tooltip, theme } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import React, { useMemo } from 'react';
import { DOCUMENTATION_PATH } from '../constants';

export type DocumentationPreviewShellProps = {
  children: ReactNode;
  href?: string;
  previewTitle: string;
};

const DocumentationPreviewShell = ({
  children,
  href = DOCUMENTATION_PATH,
  previewTitle,
}: DocumentationPreviewShellProps) => {
  const { token } = theme.useToken();
  const containerStyle = useMemo<CSSProperties>(
    () => ({
      background: token.colorBgContainer,
      padding: token.paddingMD,
      position: 'relative',
    }),
    [token.colorBgContainer, token.paddingMD],
  );
  const openTabStyle = useMemo<CSSProperties>(
    () => ({
      insetBlockStart: 0,
      insetInlineEnd: 0,
      position: 'absolute',
    }),
    [],
  );

  return (
    <div style={containerStyle}>
      <div style={openTabStyle}>
        <Tooltip title={previewTitle}>
          <a href={href} target="_blank" rel="noreferrer" aria-label={previewTitle}>
            <Button size="small" icon={<RightOutlined />} />
          </a>
        </Tooltip>
      </div>
      {children}
    </div>
  );
};

export default DocumentationPreviewShell;
