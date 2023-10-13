import { Dropdown, Button } from 'antd';
import classNames from 'classnames';
import React, { FC } from 'react';
import { useCompile } from '../../../schema-component';
import { SchemaInitializerOptions } from '../types';
import { Icon } from '../../../icon';

export const InitializerButton: FC<SchemaInitializerOptions> = (props) => {
  const { title, icon, dropdownProps, componentProps, componentStyle, style, children } = props;
  const compile = useCompile();

  return (
    <Dropdown
      className={classNames('nb-schema-initializer-button')}
      openClassName={`nb-schema-initializer-button-open`}
      {...dropdownProps}
      dropdownRender={() => <>{children}</>}
    >
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
    </Dropdown>
  );
};
