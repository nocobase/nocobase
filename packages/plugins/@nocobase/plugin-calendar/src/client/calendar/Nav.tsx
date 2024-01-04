import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { Button } from 'antd';
import React, { useContext } from 'react';
import { Navigate } from 'react-big-calendar/dist/react-big-calendar.esm';
import { CalendarToolbarContext } from './context';
import { useDesignable } from '@nocobase/client';

export const Nav = observer(
  () => {
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
