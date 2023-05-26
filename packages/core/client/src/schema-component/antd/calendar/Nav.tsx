import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { Button } from 'antd';
import React, { useContext } from 'react';
import { Navigate } from 'react-big-calendar/dist/react-big-calendar.esm';
import { useDesignable } from '../../hooks';
import { CalendarToolbarContext } from './context';

export const Nav = observer(
  (props) => {
    const { DesignableBar } = useDesignable();
    const { onNavigate } = useContext(CalendarToolbarContext);
    return (
      <div className="ant-btn-group">
        <Button icon={<LeftOutlined />} onClick={() => onNavigate(Navigate.PREVIOUS)}></Button>
        <Button icon={<RightOutlined />} onClick={() => onNavigate(Navigate.NEXT)}></Button>
        <DesignableBar />
      </div>
    );
  },
  { displayName: 'Nav' },
);
