/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import type { FC, ReactNode } from 'react';

export interface DemoBlockProps {
  title: string;
  padding?: string;
  background?: string;
  children?: ReactNode;
}

export const DemoBlock: FC<DemoBlockProps> = (props) => {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          padding: '12px 12px 8px',
          color: '#697b8c',
          fontSize: 14,
        }}
      >
        {props.title}
      </div>
      <div
        style={{
          padding: props.padding,
          background: props.background,
          borderLeft: 'none',
          borderRight: 'none',
        }}
      >
        {props.children}
      </div>
    </div>
  );
};

DemoBlock.defaultProps = {
  padding: '12px 12px',
  background: 'var(--adm-color-background)',
};
