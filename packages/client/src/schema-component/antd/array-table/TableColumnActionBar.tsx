import { css } from '@emotion/css';
import { observer } from '@formily/react';
import React from 'react';
import { SortableItem, useDesigner } from '../..';

export const designerCss = css`
  position: relative;
  &:hover {
    > .general-schema-designer {
      display: block;
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
    background: rgba(241, 139, 98, 0.06) !important;
    border: 0 !important;
    top: -16px !important;
    bottom: -16px !important;
    left: -16px !important;
    right: -16px !important;
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

export const TableColumnActionBar = observer((props) => {
  const Designer = useDesigner();
  return (
    <SortableItem className={designerCss}>
      <Designer />
      {props.children}
    </SortableItem>
  );
});
