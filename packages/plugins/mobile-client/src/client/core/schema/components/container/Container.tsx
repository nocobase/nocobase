import React from 'react';
import { css, cx } from '@emotion/css';
import { ContainerDesigner } from './Container.Designer';
import { SortableItem, useDesigner } from '@nocobase/client';

const designerCss = css`
  position: relative;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
  width: 100%;
  width: 100%;
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

const InternalContainer: React.FC = (props) => {
  const Designer = useDesigner();
  return (
    <SortableItem className={cx('nb-mobile-container', designerCss)}>
      {props.children}
      <Designer></Designer>
    </SortableItem>
  );
};

export const MContainer = InternalContainer as unknown as typeof InternalContainer & {
  Designer: typeof ContainerDesigner;
};
MContainer.Designer = ContainerDesigner;
MContainer.displayName = 'MContainer';
