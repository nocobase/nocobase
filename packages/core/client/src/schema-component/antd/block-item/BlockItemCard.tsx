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
import { SchemaComponentContext, useNewRefreshContext } from '../../context';

export const BlockItemCard = React.forwardRef<HTMLDivElement, CardProps>(({ children, ...props }, ref) => {
  const { token } = useToken();
  const style = useMemo(() => {
    return { marginBottom: token.marginBlock };
  }, [token.marginBlock]);
  const newRefreshContext = useNewRefreshContext();

  return (
    <Card ref={ref} bordered={false} style={style} {...props}>
      <SchemaComponentContext.Provider value={newRefreshContext}>{children}</SchemaComponentContext.Provider>
    </Card>
  );
});

BlockItemCard.displayName = 'BlockItemCard';
