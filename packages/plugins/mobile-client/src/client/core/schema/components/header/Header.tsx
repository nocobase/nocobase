import { css, cx } from '@emotion/css';
import { SortableItem, useCompile, useDesigner } from '@nocobase/client';
import { NavBar, NavBarProps } from 'antd-mobile';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { HeaderDesigner } from './Header.Designer';
import { useField, useFieldSchema } from '@formily/react';

export interface HeaderProps extends NavBarProps {
  title?: string;
  showBack?: boolean;
}
const InternalHeader = (props: HeaderProps) => {
  const field = useField();
  const { title = '{{ t("Untitled") }}', showBack = false } = { ...props, ...field?.componentProps };
  const Designer = useDesigner();
  const compile = useCompile();
  const history = useHistory();
  return (
    <SortableItem
      className={cx(
        'nb-mobile-header',
        css`
          & > .general-schema-designer > .general-schema-designer-icons {
            top: unset;
            bottom: 2px;
          }
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
