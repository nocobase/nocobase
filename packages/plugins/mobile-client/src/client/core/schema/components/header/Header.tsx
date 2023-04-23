import { css, cx } from '@emotion/css';
import { SortableItem, useCompile, useDesigner } from '@nocobase/client';
import { NavBar, NavBarProps } from 'antd-mobile';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { HeaderDesigner } from './Header.Designer';

export interface HeaderProps extends NavBarProps {
  title?: string;
  showBack?: boolean;
}
const InternalHeader = (props: HeaderProps) => {
  const { title, showBack = true } = props;
  const Designer = useDesigner();
  const compile = useCompile();
  const history = useHistory();
  return (
    <SortableItem
      className={cx(
        'nb-mobile-header',
        css`
          width: 100%;
          background: #fff;
        `,
      )}
    >
      <NavBar backArrow={showBack} onBack={history.goBack}>
        {compile(title)}
      </NavBar>
      <Designer />
    </SortableItem>
  );
};

export const MHeader = InternalHeader as unknown as typeof InternalHeader & {
  Designer: typeof HeaderDesigner;
};

MHeader.Designer = HeaderDesigner;
