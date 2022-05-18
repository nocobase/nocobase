import { observer } from '@formily/react';
import { Select } from 'antd';
import React, { useContext } from 'react';
import { useDesignable } from '../../hooks';
import { CalendarToolbarContext } from './context';

export const ViewSelect = observer((props) => {
  const { DesignableBar } = useDesignable();
  const {
    views,
    view,
    onView,
    localizer: { messages },
  } = useContext(CalendarToolbarContext);
  return (
    <div className="ant-btn-group">
      <Select value={view} onChange={onView}>
        {views.map((name) => (
          <Select.Option value={name}>{messages[name]}</Select.Option>
        ))}
      </Select>
      <DesignableBar />
    </div>
  );
});
