import React from 'react';
import { Card, CardProps, theme } from 'antd';

export const BlockItemCard = React.forwardRef<HTMLDivElement, CardProps>(({ children, ...props }, ref) => {
  const { token } = theme.useToken();

  return (
    <Card ref={ref} bordered={false} style={{ marginBottom: token.marginLG }} {...props}>
      {children}
    </Card>
  );
});

BlockItemCard.displayName = 'BlockItemCard';
