import { observer } from '@formily/react';
import { Select } from 'antd';
import React, { useContext } from 'react';
import { useDesignable } from '../../hooks';
import { CalendarToolbarContext } from './context';

export const ViewSelect = observer(
  (props) => {
    const { DesignableBar } = useDesignable();
    const {
      views,
      view,
      onView,
      localizer: { messages },
    } = useContext(CalendarToolbarContext);
    return (
      <div className="ant-btn-group">
        <Select data-testid="antd-select" popupMatchSelectWidth={false} value={view} onChange={onView}>
          {views.map((name) => (
            <Select.Option key={name} value={name}>
              {messages[name]}
            </Select.Option>
          ))}
        </Select>
        <DesignableBar />
      </div>
    );
  },
  { displayName: 'ViewSelect' },
);
