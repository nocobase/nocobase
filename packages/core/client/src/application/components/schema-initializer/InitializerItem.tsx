import React, { FC } from 'react';
import { useCompile } from '../../../schema-component';
import { Icon } from '../../../icon';

export interface InitializerItemProps {
  style?: React.CSSProperties;
  className?: string;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  onClick: () => any;
}

export const InitializerItem: FC<InitializerItemProps> = (props) => {
  const { style, className, icon, title, onClick, children } = props;
  const compile = useCompile();
  return (
    <div onClick={onClick} style={style} className={className}>
      {children || (
        <>
          {typeof icon === 'string' ? <Icon type={icon as string} /> : icon}
          {compile(title)}
        </>
      )}
    </div>
  );
};
