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
      <Button
        onClick={() => {
          ctx.logger.info('This is an info message');
          ctx.message.success('This is a success message');
        }}
      >
        message
      </Button>
      <Button
        onClick={() =>
          ctx.notification.open({
            message: 'Notification Title',
            description: 'This is the content of the notification.',
          })
        }
      >
        notification
      </Button>
      <Button onClick={() => ctx.modal.confirm({ title: 'Confirm', content: 'Are you sure?' })}>modal</Button>
    </div>
  );
}
