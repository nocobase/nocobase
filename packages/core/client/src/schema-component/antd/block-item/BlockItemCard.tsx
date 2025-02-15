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

export const BlockItemCard = React.forwardRef<HTMLDivElement, CardProps>(({ children, ...props }: any, ref) => {
  const { token } = useToken();
  const style = useMemo(() => {
    return { marginBottom: token.marginBlock, height: props.height || '100%' };
  }, [token.marginBlock]);

  return (
    <Card ref={ref} bordered={false} style={style} {...props}>
      {children}
    </Card>
  );
});

BlockItemCard.displayName = 'BlockItemCard';
