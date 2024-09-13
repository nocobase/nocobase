/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Statistic as AntdStatistic } from 'antd';

export const Statistic: React.FC<any> = (props: any) => {
  const { link, ...options } = props;
  return (
    <div
      onClick={() => {
        if (link) {
          window.open(link, '__blank');
        }
      }}
      style={{
        cursor: link ? 'pointer' : 'auto',
      }}
    >
      <AntdStatistic {...options} />
    </div>
  );
};
