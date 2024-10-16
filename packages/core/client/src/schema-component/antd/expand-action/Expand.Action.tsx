/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { useFieldSchema } from '@formily/react';
import { Button, theme } from 'antd';
import React, { forwardRef, createRef } from 'react';
import { composeRef } from 'rc-util/lib/ref';
import { useCompile } from '../../hooks';
import { useTableBlockContext, useTableSelectorContext } from '../../../block-provider';
import { Icon } from '../../../icon';

const actionDesignerCss = css`
  position: relative;
  &:hover {
    .general-schema-designer {
      display: block;
    }
  }
  .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: var(--colorBgSettingsHover);
    border: 0;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
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

const InternalExpandAction = (props, ref) => {
  const schema = useFieldSchema();
  const ctxSelector = useTableSelectorContext();
  const ctxBlock = useTableBlockContext();
  const isTableSelector = schema.parent?.parent?.['x-decorator'] === 'TableSelectorProvider';
  const ctx = isTableSelector ? ctxSelector : ctxBlock;
  const { titleExpand, titleCollapse, iconExpand, iconCollapse } = schema['x-component-props'] || {};
  const compile = useCompile();
  const internalRef = createRef<HTMLButtonElement | HTMLAnchorElement>();
  const buttonRef = composeRef(ref, internalRef);
  const { token } = theme.useToken();
  const actionTitle = ctx?.expandFlag ? compile(titleCollapse) : compile(titleExpand);
  const icon = ctx?.expandFlag ? iconCollapse : iconExpand;
  return (
    //@ts-ignore
    <div className={actionDesignerCss} ref={buttonRef as React.Ref<HTMLButtonElement>}>
      {ctx?.params['tree'] && (
        <Button
          onClick={() => {
            ctx?.setExpandFlag();
          }}
          icon={<Icon type={ctx?.expandFlag ? iconCollapse : iconExpand} />}
          type={props.type}
          style={props?.style}
          className={css`
            .ant-btn-icon {
              margin-inline-end: 0px !important;
            }
          `}
        >
          {props.children?.[1]}

          {actionTitle && (
            <span
              className={
                icon
                  ? css`
                      margin-inline-start: ${token.controlPaddingHorizontalSM}px;
                    `
                  : null
              }
            >
              {actionTitle}
            </span>
          )}
        </Button>
      )}
    </div>
  );
};

export const ExpandAction = forwardRef<HTMLButtonElement | HTMLAnchorElement, any>(InternalExpandAction);
