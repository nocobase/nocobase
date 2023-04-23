import { css, cx } from '@emotion/css';
import { SortableItem, useCompile, useDesigner } from '@nocobase/client';
import { NavBar, NavBarProps } from 'antd-mobile';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { HeaderDesigner } from './Header.Designer';

const designerCss = css`
  position: relative;
  width: 100%;
  background: #fff;
  &:hover {
    > .general-schema-designer {
      display: block;
    }
  }
  &.nb-action-link {
    > .general-schema-designer {
      top: -10px;
      bottom: -10px;
      left: -10px;
      right: -10px;
    }
  }
  > .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    border: 0;
    pointer-events: none;
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: #f18b62;
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
      }
    }
  }
`;

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
    <SortableItem className={cx('nb-mobile-header', designerCss)}>
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
