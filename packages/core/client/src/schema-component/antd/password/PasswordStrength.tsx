import { isFn } from '@formily/shared';
import React, { Fragment } from 'react';
import { getStrength } from './utils';

type ReactRenderPropsChildren<T = any> = React.ReactNode | ((props: T) => React.ReactElement);

interface IPasswordStrengthProps {
  value?: any;
  children?: ReactRenderPropsChildren<number>;
}

export const PasswordStrength: React.FC<IPasswordStrengthProps> = (props) => {
  if (isFn(props.children)) {
    return props.children(getStrength(String(props.value || '')));
  } else {
    return <Fragment>{props.children}</Fragment>;
  }
};
