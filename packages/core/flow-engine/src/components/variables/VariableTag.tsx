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

const VARIABLE_PARSING_FAILED_TEXT = 'Variable parsing failed';

const VariableTagComponent: React.FC<VariableTagProps> = ({
  value,
  onClear,
  disabled = false,
  allowCustomTagInput = true,
  className,
  style,
  metaTreeNode,
  metaTree,
}) => {
  const { resolvedMetaTree } = useResolvedMetaTree(metaTree);
  const ctx = useFlowContext();

  const { data: displayState } = useRequest(
    async () => {
      const resolveLabelFromPath = async (
        rawPath?: (string | number)[],
      ): Promise<{ label: string | null; resolved: boolean; attempted: boolean }> => {
        if (!rawPath) return { label: null, resolved: false, attempted: false };
        if (!Array.isArray(rawPath)) return { label: null, resolved: false, attempted: false };
        if (!Array.isArray(resolvedMetaTree)) return { label: null, resolved: false, attempted: false };

        // 兼容 metaTree 为子树：顶层不含首段时，裁剪首段
        const topNames = new Set((resolvedMetaTree || []).map((n: any) => String(n?.name)));
        const path = !topNames.has(String(rawPath[0])) ? rawPath.slice(1) : rawPath;
        if (!path.length) return { label: '', resolved: true, attempted: true };

        let nodes: MetaTreeNode[] | undefined = resolvedMetaTree as MetaTreeNode[];
        const titleChain: string[] = [];

        for (let i = 0; i < path.length; i++) {
          if (!nodes) return { label: null, resolved: false, attempted: true };
          const seg = String(path[i]);
          const node = nodes.find((n) => String(n?.name) === seg) as MetaTreeNode | undefined;
          if (!node) return { label: null, resolved: false, attempted: true };

          titleChain.push(String(node.title ?? node.name ?? seg));

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

        return { label: titleChain.map(ctx.t).join('/'), resolved: true, attempted: true };
      };

      // 1) 优先使用已解析到的节点（包含完整父标题链）
      if (metaTreeNode?.parentTitles) {
        return {
          text: [...metaTreeNode.parentTitles, metaTreeNode.title].map(ctx.t).join('/'),
          invalid: false,
        };
      }

      // 2) metaTreeNode 存在但缺少 parentTitles：尝试根据 value/metaTreeNode.paths 从 metaTree 还原完整路径
      if (metaTreeNode) {
        const rawPath = parseValueToPath(value) || metaTreeNode.paths;
        const result = await resolveLabelFromPath(rawPath as any);
        if (result.resolved && result.label != null) {
          return { text: result.label, invalid: false };
        }
        if (result.attempted) {
          return { text: VARIABLE_PARSING_FAILED_TEXT, invalid: true, rawValue: String(value ?? '') };
        }
        return { text: ctx.t(metaTreeNode.title) ?? '', invalid: false };
      }

      // 3) 无 metaTreeNode：从 value 还原路径并拼接标题链；若找不到任何前缀则回退原始路径字符串
      if (!value) return { text: String(value), invalid: false };
      const rawPath = parseValueToPath(value);
      const result = await resolveLabelFromPath(rawPath as any);
      if (result.resolved && result.label != null) {
        return { text: result.label, invalid: false };
      }
      if (result.attempted) {
        return { text: VARIABLE_PARSING_FAILED_TEXT, invalid: true, rawValue: String(value ?? '') };
      }
      return { text: Array.isArray(rawPath) ? rawPath.join('/') : String(value), invalid: false };
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
    const fullText = displayState?.text || (typeof props.label === 'string' ? props.label : String(props.label));
    const tooltipText = displayState?.invalid ? displayState.rawValue || fullText : fullText;

    return (
      <Tooltip title={tooltipText} placement="top" getPopupContainer={() => document.body}>
        <Tag
          color={displayState?.invalid ? 'error' : 'blue'}
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
      value={displayState?.text ? [displayState.text] : []}
      mode={allowCustomTagInput ? 'tags' : 'multiple'}
      open={false}
      showSearch={allowCustomTagInput}
      searchValue={allowCustomTagInput ? undefined : ''}
      allowClear={!disabled && !!onClear}
      onClear={disabled ? undefined : onClear}
      disabled={disabled || !onClear}
      variant="outlined"
      suffixIcon={null}
      tagRender={customTagRender}
      onClick={(e) => e.preventDefault()}
      removeIcon={null}
    />
  );
};

export const VariableTag = React.memo(VariableTagComponent);
