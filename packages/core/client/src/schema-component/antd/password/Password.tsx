/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapReadPretty } from '@formily/react';
import { Input } from 'antd';
import { PasswordProps as AntdPasswordProps } from 'antd/es/input';
import React from 'react';
import { PasswordStrength } from './PasswordStrength';

export interface PasswordProps extends AntdPasswordProps {
  checkStrength?: boolean;
  showForgotPassword?: boolean;
}

export const Password = connect(
  (props: PasswordProps) => {
    const { value, className, checkStrength, showForgotPassword, ...others } = props;
    const blockStyle: React.CSSProperties = {
      position: 'absolute',
      zIndex: 1,
      height: 8,
      top: 0,
      background: '#fff',
      width: 1,
      transform: 'translate(-50%, 0)',
    };
    return (
      <span className={className}>
        <Input.Password {...others} value={value} />
        {checkStrength && (
          <PasswordStrength value={value}>
            {(score) => {
              return (
                <div
                  style={{
                    background: '#e0e0e0',
                    marginBottom: 3,
                    position: 'relative',
                  }}
                >
                  <div style={{ ...blockStyle, left: '20%' }} />
                  <div style={{ ...blockStyle, left: '40%' }} />
                  <div style={{ ...blockStyle, left: '60%' }} />
                  <div style={{ ...blockStyle, left: '80%' }} />
                  <div
                    style={{
                      position: 'relative',
                      backgroundImage: '-webkit-linear-gradient(left, #ff5500, #ff9300)',
                      transition: 'all 0.35s ease-in-out',
                      height: 8,
                      width: '100%',
                      marginTop: 5,
                      clipPath: `polygon(0 0,${score}% 0,${score}% 100%,0 100%)`,
                    }}
                  />
                </div>
              );
            }}
          </PasswordStrength>
        )}
      </span>
    );
  },
  mapReadPretty((props) => {
    if (!props.value) {
      return <div></div>;
    }
    return <div>********</div>;
  }),
);

export default Password;
