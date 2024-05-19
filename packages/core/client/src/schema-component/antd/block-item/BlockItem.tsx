/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import cls from 'classnames';
import React, { useMemo } from 'react';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { CustomCreateStylesUtils, createStyles } from '../../../style';
import { SortableItem } from '../../common';
import { useDesigner, useProps } from '../../hooks';
import { useGetAriaLabelOfBlockItem } from './hooks/useGetAriaLabelOfBlockItem';

const useStyles = createStyles(({ css, token }: CustomCreateStylesUtils) => {
  return css`
    position: relative;
    &:hover {
      > .general-schema-designer {
        display: block;
      }
    }
    &.nb-form-item:hover {
      > .general-schema-designer {
        background: var(--colorBgSettingsHover) !important;
        border: 0 !important;
        top: -5px !important;
        bottom: -5px !important;
        left: -5px !important;
        right: -5px !important;
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
      border: 2px solid var(--colorBorderSettingsHover);
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

    .ant-card {
      border-radius: ${token.borderRadiusBlock};
    }
  `;
});

export interface BlockItemProps {
  name?: string;
  className?: string;
  children?: React.ReactNode;
}

export const BlockItem: React.FC<BlockItemProps> = withDynamicSchemaProps(
  (props) => {
    // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
    const { className, children } = useProps(props);
    const { styles: blockItemCss } = useStyles();

    const Designer = useDesigner();
    const fieldSchema = useFieldSchema();
    const { getAriaLabel } = useGetAriaLabelOfBlockItem(props.name);

    const label = useMemo(() => getAriaLabel(), [getAriaLabel]);

    return (
      <SortableItem role="button" aria-label={label} className={cls('nb-block-item', className, blockItemCss)}>
        <Designer {...fieldSchema['x-toolbar-props']} />
        {children}
      </SortableItem>
    );
  },
  { displayName: 'BlockItem' },
);
