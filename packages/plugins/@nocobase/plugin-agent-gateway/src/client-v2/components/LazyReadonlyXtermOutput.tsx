/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { Suspense } from 'react';
import { Flex, Spin } from 'antd';

import type { ReadonlyXtermOutputProps } from './ReadonlyXtermOutput';

const ReadonlyXtermOutput = React.lazy(() => import('./ReadonlyXtermOutput'));

export function LazyReadonlyXtermOutput(props: ReadonlyXtermOutputProps) {
  return (
    <Suspense
      fallback={
        <Flex align="center" justify="center" style={{ minHeight: 160 }}>
          <Spin />
        </Flex>
      }
    >
      <ReadonlyXtermOutput {...props} />
    </Suspense>
  );
}

export default LazyReadonlyXtermOutput;
