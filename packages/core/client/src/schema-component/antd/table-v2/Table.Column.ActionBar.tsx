/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { observer } from '@formily/react';
import React from 'react';
import { SortableItem, useDesigner, useSchemaComponentContext } from '../..';
import { useFlag } from '../../../flag-provider/hooks/useFlag';
import { useToken } from '../__builtins__';
import { BlockContext, useBlockContext } from '../../../';

export const designerCss = ({ margin = '-18px -16px', padding = '18px 16px' } = {}) => css`
  position: relative;
  margin: ${margin};
  padding: ${padding};

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
    background: var(--colorBgSettingsHover) !important;
    border: 0 !important;
    pointer-events: none;
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: var(--colorSettings);
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
        align-self: stretch;
      }
    }
  }
`;

export const TableColumnActionBar = observer(
  (props: any) => {
    const Designer = useDesigner();
    const { isInSubTable } = useFlag() || {};
    const { designable } = useSchemaComponentContext();
    const { token } = useToken();
    const { name } = useBlockContext?.() || {};

    if (!designable || Designer.isNullComponent) {
      return props.children;
    }

    return (
      <SortableItem
        className={designerCss({
          margin: `-${token.margin}px -${token.marginXS}px`,
          padding: `${token.margin}px ${token.marginXS}px`,
        })}
      >
        <BlockContext.Provider value={{ name: isInSubTable ? name : 'taleColumn' }}>
          <Designer />
          {props.children}
        </BlockContext.Provider>
      </SortableItem>
    );
  },
  { displayName: 'TableColumnActionBar' },
);
