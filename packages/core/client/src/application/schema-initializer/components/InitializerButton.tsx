import { Button } from 'antd';
import React, { FC } from 'react';
import { useCompile } from '../../../schema-component';
import { SchemaInitializerOptions } from '../types';
import { Icon } from '../../../icon';

export const InitializerButton: FC<SchemaInitializerOptions> = (props) => {
  const { title, icon, componentProps, componentStyle, style } = props;
  const compile = useCompile();

  return (
    <Button
      type={'dashed'}
      data-testid={props['data-testid']}
      style={{
        borderColor: 'var(--colorSettings)',
        color: 'var(--colorSettings)',
        ...componentStyle,
        ...style,
      }}
      {...componentProps}
      icon={typeof icon === 'string' ? <Icon type={icon as string} /> : icon}
    >
      {compile(title)}
    </Button>
  );
};
