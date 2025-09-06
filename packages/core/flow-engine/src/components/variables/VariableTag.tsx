/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Select, Tag, theme } from 'antd';
import { cx } from '@emotion/css';
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

  const customTagRender = (props: any) => {
    const { label, closable, onClose } = props;

    const truncateText = (text: string, maxLength = 16) => {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    return (
      <Tag
        color="blue"
        style={{
          margin: `0 ${token.marginXXS || token.marginXS}px`,
          borderRadius: token.borderRadiusSM,
          fontSize: token.fontSizeSM,
          display: 'inline-flex',
          alignItems: 'center',
          padding: `0 ${token.paddingXXS}px`,
        }}
      >
        {truncateText(label)}
      </Tag>
    );
  };

  return (
    <Select
      className={cx('variable', className)}
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
      maxTagTextLength={20}
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
