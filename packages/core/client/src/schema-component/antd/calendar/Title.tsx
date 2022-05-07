import { observer } from '@formily/react';
import React, { useContext } from 'react';
import { useDesignable } from '../../hooks';
import { CalendarToolbarContext } from './context';

export const Title = observer(() => {
  const { DesignableBar } = useDesignable();
  const { label } = useContext(CalendarToolbarContext);
  return (
    <div className="ant-btn-group" style={{ fontSize: '1.75em', fontWeight: 300 }}>
      {label}
      <DesignableBar />
    </div>
  );
});
