import { Button } from 'antd';
import React, { FC } from 'react';
import { useCompile } from '../../../schema-component';
import { SchemaInitializerOptions } from '../types';
import { Icon } from '../../../icon';

export const InitializerButton: FC<SchemaInitializerOptions> = (props) => {
  const { style, options, ...others } = props;
  const compile = useCompile();

  return (
    <Button
      type={'dashed'}
      data-testid={props['data-testid']}
      style={{
        borderColor: 'var(--colorSettings)',
        color: 'var(--colorSettings)',
        ...style,
      }}
      icon={typeof options.icon === 'string' ? <Icon type={options.icon as string} /> : options.icon}
      {...others}
    >
      {compile(options.title)}
    </Button>
  );
};
