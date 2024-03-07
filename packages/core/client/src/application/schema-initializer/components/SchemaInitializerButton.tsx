import { Button, ButtonProps } from 'antd';
import React, { FC } from 'react';
import { Icon } from '../../../icon';
import { useCompile } from '../../../schema-component';
import { useGetAriaLabelOfSchemaInitializer } from '../../../schema-initializer/hooks/useGetAriaLabelOfSchemaInitializer';
import { SchemaInitializerOptions } from '../types';

export interface SchemaInitializerButtonProps extends ButtonProps {
  options: SchemaInitializerOptions;
}

export const SchemaInitializerButton: FC<SchemaInitializerButtonProps> = React.memo((props) => {
  const { style, options, ...others } = props;
  const compile = useCompile();
  const { getAriaLabel } = useGetAriaLabelOfSchemaInitializer();

  return (
    <Button
      data-testid={options['data-testid']}
      aria-label={getAriaLabel()}
      aria-disabled="false"
      type={'dashed'}
      style={{
        borderColor: 'var(--colorSettings)',
        color: 'var(--colorSettings)',
        ...style,
      }}
      icon={typeof options.icon === 'string' ? <Icon type={options.icon as string} /> : options.icon}
      {...others}
    >
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'inline-block',
          width: options.icon ? 'calc(100% - 14px)' : '100%',
          verticalAlign: 'bottom',
        }}
      >
        {compile(options.title)}
      </span>
    </Button>
  );
});
SchemaInitializerButton.displayName = 'SchemaInitializerButton(memo)';
