/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Select, Tag, theme, Tooltip } from 'antd';
import { cx, css } from '@emotion/css';
import type { VariableTagProps } from './types';
import { parseValueToPath } from './utils';
import { useResolvedMetaTree } from './useResolvedMetaTree';
import { useRequest } from 'ahooks';
import { useFlowContext } from '../../FlowContextProvider';

const VariableTagComponent: React.FC<VariableTagProps> = ({
  value,
  onClear,
  className,
  style,
  metaTreeNode,
  metaTree,
}) => {
  const { resolvedMetaTree } = useResolvedMetaTree(metaTree);
  const ctx = useFlowContext();

  const { data: displayedValue } = useRequest(
    async () => {
      if (metaTreeNode) {
        return metaTreeNode.parentTitles
          ? [...metaTreeNode.parentTitles, metaTreeNode.title].map(ctx.t).join('/')
          : ctx.t(metaTreeNode.title) || '';
      }
      if (!value) return String(value);
      const path = parseValueToPath(value);
      return path ? path.join('/') : String(value);
    },
    { refreshDeps: [resolvedMetaTree, value, metaTreeNode] },
  );

  const { token } = theme.useToken();

  // 修复 rc-select tags 模式下单个 tag 不能收缩的问题：
  // 让包裹 tag 的 overflow item 可收缩，从而触发内部文本的省略。
  const shrinkableOverflowItem = css`
    /* 选择器容器允许收缩并隐藏超出 */
    & .ant-select-selector {
      min-width: 0;
      overflow: hidden;
    }
    /* rc-overflow 只展示单行，避免换行导致容器增高 */
    & .rc-overflow {
      flex-wrap: nowrap;
    }
  `;

  const customTagRender = (props: any) => {
    const { label } = props;
    const fullText = typeof label === 'string' ? label : String(label);

    return (
      <Tooltip title={fullText} placement="top" getPopupContainer={() => document.body}>
        <Tag
          color="blue"
          style={{
            margin: `0 ${token.marginXXS || token.marginXS}px`,
            borderRadius: token.borderRadiusSM,
            fontSize: token.fontSizeSM,
            display: 'inline-flex',
            alignItems: 'center',
            padding: `0 ${token.paddingXXS}px`,
            minWidth: 0,
            maxWidth: '100%',
            overflow: 'hidden',
            width: '100%',
          }}
        >
          <span
            style={{
              minWidth: 0,
              width: '100%',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              display: 'inline-block',
            }}
          >
            {fullText}
          </span>
        </Tag>
      </Tooltip>
    );
  };

  return (
    <Select
      className={cx('variable', shrinkableOverflowItem, className)}
      style={{
        // Fill the available width of the surrounding layout.
        // A fixed maxWidth here caused the input to shrink when a variable is selected.
        width: '100%',
        minWidth: 0,
        flex: '1 1 auto',
        ...style,
      }}
      value={displayedValue ? [displayedValue] : []}
      mode="tags"
      open={false}
      allowClear={!!onClear}
      onClear={onClear}
      disabled={!onClear}
      variant="outlined"
      suffixIcon={null}
      tagRender={customTagRender}
      onClick={(e) => e.preventDefault()}
      removeIcon={null}
    />
  );
};

export const VariableTag = React.memo(VariableTagComponent);
