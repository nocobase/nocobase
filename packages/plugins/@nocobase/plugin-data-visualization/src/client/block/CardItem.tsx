/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { CardItem, useToken, withDynamicSchemaProps } from '@nocobase/client';

export const ChartCardItem = withDynamicSchemaProps(
  (props) => {
    const { token } = useToken();
    return (
      <CardItem
        className="nb-chart-block"
        name="charts"
        bodyStyle={{
          padding: `${token.paddingLG}px ${token.paddingLG}px 0`,
        }}
        {...props}
      >
        {props.children}
      </CardItem>
    );
  },
  {
    displayName: 'ChartCardItem',
  },
);
