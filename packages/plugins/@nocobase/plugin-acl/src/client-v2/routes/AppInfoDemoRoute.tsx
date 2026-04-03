/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

export default function AppInfoDemoRoute() {
  const ctx = useFlowContext();
  return (
    <div>
      <div>App Info Demo Route</div>
      <Button onClick={() => ctx.router.navigate('/v2-demo/')}>Go to demo route</Button>
    </div>
  );
}
