import { Card, CardProps } from 'antd';
import React from 'react';
import { useToken } from '../../../style';

export const BlockItemCard = React.forwardRef<HTMLDivElement, CardProps>(({ children, ...props }, ref) => {
  const { token } = useToken();

  return (
    <Card ref={ref} bordered={false} style={{ marginBottom: token.marginBlock }} {...props}>
      {children}
    </Card>
  );
});

BlockItemCard.displayName = 'BlockItemCard';
