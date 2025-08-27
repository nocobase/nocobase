/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef } from 'react';
import { observer } from '@nocobase/flow-engine';
import { notification, Flex, Button } from 'antd';
import { aiSelection } from './stores/ai-selection';
import { BorderOutlined } from '@ant-design/icons';

export const AISelectionControl: React.FC = observer(() => {
  const [api, contextHolder] = notification.useNotification();
  const key = useRef(`ai-selection-control-${new Date().getTime()}`);
  if (aiSelection.selectable !== '') {
    api.open({
      key: key.current,
      closeIcon: false,
      message: (
        <Flex justify="space-between" align="center">
          <span>Selecting Block</span>
          <Button
            type="primary"
            danger
            shape="circle"
            icon={<BorderOutlined />}
            onClick={() => {
              aiSelection.stopSelect();
            }}
          ></Button>
        </Flex>
      ),
      duration: 0,
      placement: 'bottom',
      style: {
        width: 200,
      },
    });
  } else {
    api.destroy(key.current);
  }

  return <>{contextHolder}</>;
});
