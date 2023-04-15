import React from 'react';
import { css, cx } from '@emotion/css';
import classNames from 'classnames';
import { MobileCenterDesigner } from './MobileCenter.Designer';
import { SortableItem, useDesigner } from '@nocobase/client';
import { useField } from '@formily/react';

const designerCss = css`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(100% + 40px);
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
    background: rgba(241, 139, 98, 0.06);
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

const InternalMobileCenter: React.FC = (props) => {
  const Designer = useDesigner();
  const field = useField();
  console.log('🚀 ~ file: MobileCenter.tsx:11 ~ field:', field);
  return (
    <div
      className={cx(
        'nb-mobile-center',
        css`
          display: flex;
          width: 100%;
          height: 100%;
        `,
      )}
    >
      {props.children}
      <SortableItem className={designerCss}>
        <Designer></Designer>
      </SortableItem>
    </div>
  );
};

export const MobileCenter = InternalMobileCenter as unknown as typeof InternalMobileCenter & {
  Designer: typeof MobileCenterDesigner;
};
MobileCenter.Designer = MobileCenterDesigner;
MobileCenter.displayName = 'MobileCenter';

export default MobileCenter;
