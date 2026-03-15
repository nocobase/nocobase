/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { Button } from 'antd';
import React, { useContext } from 'react';
import { CalendarToolbarContext } from './context';
import { useDesignable, useLazy } from '@nocobase/client';

export const Nav = observer(
  () => {
    const Navigate = useLazy<typeof import('react-big-calendar/dist/react-big-calendar.esm').Navigate>(
      () => import('react-big-calendar/dist/react-big-calendar.esm'),
      'Navigate',
    );
    const { DesignableBar } = useDesignable();
    const { onNavigate } = useContext(CalendarToolbarContext);
    return (
      <Button.Group>
        <Button icon={<LeftOutlined />} onClick={() => onNavigate(Navigate.PREVIOUS)}></Button>
        <Button icon={<RightOutlined />} onClick={() => onNavigate(Navigate.NEXT)}></Button>
        <DesignableBar />
      </Button.Group>
    );
  },
  { displayName: 'Nav' },
);
