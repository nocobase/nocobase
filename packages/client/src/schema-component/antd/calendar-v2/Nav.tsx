import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { Button } from 'antd';
import React, { useContext } from 'react';
import { navigate } from 'react-big-calendar/lib/utils/constants';
import { useDesignable } from '../../hooks';
import { CalendarToolbarContext } from './context';

export const Nav = observer((props) => {
  const { DesignableBar } = useDesignable();
  const { onNavigate } = useContext(CalendarToolbarContext);
  return (
    <div className="ant-btn-group">
      <Button icon={<LeftOutlined />} onClick={() => onNavigate(navigate.PREVIOUS)}></Button>
      <Button icon={<RightOutlined />} onClick={() => onNavigate(navigate.NEXT)}></Button>
      <DesignableBar />
    </div>
  );
});
