import { css, cx } from '@emotion/css';
import { SortableItem, useCompile, useDesigner } from '@nocobase/client';
import { NavBar, NavBarProps } from 'antd-mobile';
import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { HeaderDesigner } from './Header.Designer';
import { useField } from '@formily/react';
import { generateNTemplate } from '../../../../locale';

export interface HeaderProps extends NavBarProps {
  title?: string;
  showBack?: boolean;
}
const InternalHeader = (props: HeaderProps) => {
  const field = useField();
  const { title = generateNTemplate('Untitled'), showBack = false } = { ...props, ...field?.componentProps };
  const Designer = useDesigner();
  const compile = useCompile();
  const compiledTitle = compile(title);
  const history = useHistory();

  useEffect(() => {
    // sync title
    document.title = `${compiledTitle} - NocoBase`;
  }, [compiledTitle]);

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
        {compiledTitle}
      </NavBar>
      <Designer />
    </SortableItem>
  );
};

export const MHeader = InternalHeader as unknown as typeof InternalHeader & {
  Designer: typeof HeaderDesigner;
};

MHeader.Designer = HeaderDesigner;
