/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card, CardProps } from 'antd';
import React, { useMemo } from 'react';
import { useToken } from '../../../style';
import { MarkdownReadPretty } from '../markdown';

export const BlockItemCard = React.forwardRef<HTMLDivElement, CardProps | any>(({ children, ...props }, ref) => {
  const { token } = useToken();
  const style = useMemo(() => {
    return { marginBottom: token.marginBlock };
  }, [token.marginBlock]);
  const title = (
    <div>
      {props.title}
      {props.description && (
        <MarkdownReadPretty value={props.description} style={{ fontWeight: 400, marginTop: '10px' }} />
      )}
    </div>
  );
  return (
    <Card ref={ref} bordered={false} style={style} {...props} title={title}>
      {children}
    </Card>
  );
});

BlockItemCard.displayName = 'BlockItemCard';
