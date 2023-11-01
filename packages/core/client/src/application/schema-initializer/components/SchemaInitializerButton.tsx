import { Button } from 'antd';
import React, { FC } from 'react';
import { Icon } from '../../../icon';
import { useCompile } from '../../../schema-component';
import { useGetAriaLabelOfSchemaInitializer } from '../../../schema-initializer/hooks/useGetAriaLabelOfSchemaInitializer';
import { SchemaInitializerOptions } from '../types';

export const SchemaInitializerButton: FC<SchemaInitializerOptions> = (props) => {
  const { style, options, ...others } = props;
  const compile = useCompile();
  const { getAriaLabel } = useGetAriaLabelOfSchemaInitializer();

  return (
    <Button
      type={'dashed'}
      style={{
        borderColor: 'var(--colorSettings)',
        color: 'var(--colorSettings)',
        ...style,
      }}
      icon={typeof options.icon === 'string' ? <Icon type={options.icon as string} /> : options.icon}
      {...others}
      aria-label={getAriaLabel()}
    >
      {compile(options.title)}
    </Button>
  );
};
