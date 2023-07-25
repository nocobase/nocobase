import classNames from 'classnames';
import React from 'react';
import makeStyle from './utils/makeStyle';

const useStyle = makeStyle('IconSwitch', () => {
  const activeBackground = '#314659';
  return {
    '.theme-editor-icon-switch': {
      display: 'inline-block',

      '.holder': {
        position: 'relative',
        display: 'inline-flex',
        background: '#ebedf0',
        borderRadius: '100vw',
        cursor: 'pointer',
        transition: 'all 0.3s',

        '&::before': {
          position: 'absolute',
          top: 0,
          left: 'calc(100% - 32px)',
          width: 32,
          height: 32,
          background: activeBackground,
          borderRadius: '100vw',
          transition: 'all 0.3s',
          content: '""',
        },

        '&.leftChecked::before': {
          left: 0,
        },

        '&:hover': {
          boxShadow: '0 0 3px fade(@active-background, 40%)',
        },
      },

      '.icon': {
        position: 'relative',
        width: 32,
        height: 32,
        color: '#a3b1bf',
        lineHeight: '32px',
        textAlign: 'center',
        transition: 'all 0.3s',
        fontSize: 16,

        '.anticon': {
          fontSize: 14,
        },

        '&:first-child': {
          marginInlineEnd: -4,
        },

        '&.active': {
          color: '#fff',
        },
      },
    },
  };
});

export interface IconSwitchProps {
  className?: string;
  style?: React.CSSProperties;
  leftChecked?: boolean;
  leftIcon: React.ReactNode;
  rightIcon: React.ReactNode;
  onChange?: (leftChecked: boolean) => void;
  transparent?: boolean;
}

export default function IconSwitch({
  className,
  style,
  leftIcon,
  rightIcon,
  leftChecked,
  transparent,
  onChange,
  ...props
}: IconSwitchProps) {
  const [wrapSSR, hashId] = useStyle();

  return wrapSSR(
    <div className={classNames('theme-editor-icon-switch', className, hashId)} style={style} {...props}>
      <div
        className={classNames('holder', leftChecked && 'leftChecked')}
        onClick={() => {
          onChange?.(!leftChecked);
        }}
      >
        <span className={classNames('icon', leftChecked && 'active')}>{leftIcon}</span>
        <span className={classNames('icon', !leftChecked && 'active')}>{rightIcon}</span>
      </div>
    </div>,
  );
}
