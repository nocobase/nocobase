/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card, Skeleton, Spin } from 'antd';
import React from 'react';

export function SkeletonFallback() {
  return (
    <Card style={{ margin: 16 }}>
      <Skeleton paragraph={{ rows: 3 }} />
    </Card>
  );
}
