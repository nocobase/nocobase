import React from 'react';
import { Card, CardProps } from 'antd';
import useStyles from './style';

export const BlockItemCard = React.forwardRef<HTMLDivElement, CardProps>(({ children, ...props }, ref) => {
  const { componentCls, hashId } = useStyles();

  return (
    <Card ref={ref} bordered={false} className={`${componentCls} ${hashId} noco-card-item`} {...props}>
      {children}
    </Card>
  );
});

BlockItemCard.displayName = 'BlockItemCard';
