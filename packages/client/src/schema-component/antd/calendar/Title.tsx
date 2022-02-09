import { observer } from '@formily/react';
import React, { useContext } from 'react';
import { useDesignable } from '../../hooks';
import { ToolbarContext } from './context';

export const Title = observer(() => {
  const { DesignableBar } = useDesignable();
  const { label } = useContext(ToolbarContext);
  return (
    <div className="ant-btn-group" style={{ fontSize: '1.75em', fontWeight: 300 }}>
      {label}
      <DesignableBar />
    </div>
  );
});
