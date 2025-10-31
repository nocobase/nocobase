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
import type { MetaTreeNode } from '../../flowContext';

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
      // 1) 优先使用已解析到的节点（包含完整父标题链）
      if (metaTreeNode) {
        return metaTreeNode.parentTitles
          ? [...metaTreeNode.parentTitles, metaTreeNode.title].map(ctx.t).join('/')
          : ctx.t(metaTreeNode.title) || '';
      }

      // 2) 无 metaTreeNode 时，尝试从值还原路径，并在 metaTree 中寻找“最深前缀节点”，
      //    即便最后一段无效，也能显示前缀的翻译标题。
      if (!value) return String(value);
      const rawPath = parseValueToPath(value);
      if (!rawPath || !Array.isArray(resolvedMetaTree)) {
        return Array.isArray(rawPath) ? rawPath.join('/') : String(value);
      }

      // 兼容 metaTree 为子树：顶层不含首段时，裁剪首段
      const topNames = new Set((resolvedMetaTree || []).map((n: any) => String(n?.name)));
      const path = !topNames.has(String(rawPath[0])) ? rawPath.slice(1) : rawPath;
      if (!path.length) return '';

      let nodes: MetaTreeNode[] | undefined = resolvedMetaTree as MetaTreeNode[];
      let deepest: MetaTreeNode | null = null;
      let matchedCount = 0;
      for (let i = 0; i < path.length; i++) {
        if (!nodes) break;
        const seg = String(path[i]);
        const node = nodes.find((n) => String(n?.name) === seg) as MetaTreeNode | undefined;
        if (!node) break; // 停在第一个无效段之前
        deepest = node;
        matchedCount = i + 1;
        if (i < path.length - 1) {
          if (Array.isArray(node.children)) {
            nodes = node.children as any;
          } else if (typeof node.children === 'function') {
            try {
              const childNodes = await (node.children as any)();
              (node as any).children = childNodes;
              nodes = childNodes as any;
            } catch {
              nodes = undefined;
            }
          } else {
            nodes = undefined;
          }
        }
      }

      if (deepest) {
        const titles = deepest.parentTitles ? [...deepest.parentTitles, deepest.title] : [deepest.title];
        let label = titles.map(ctx.t).join('/');
        if (matchedCount < path.length) {
          const tail = path.slice(matchedCount).join('/');
          label = tail ? `${label}/${tail}` : label;
        }
        return label;
      }

      // 3) 完全找不到任何前缀时，退回原始路径字符串
      return path.join('/');
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
