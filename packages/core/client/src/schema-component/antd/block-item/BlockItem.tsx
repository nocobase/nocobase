/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React, { useMemo } from 'react';
import { useFieldSchema } from '@formily/react';
import cls from 'classnames';
import { ErrorBoundary } from 'react-error-boundary';
import { useSchemaToolbarRender } from '../../../application';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { SortableItem } from '../../common';
import { useProps } from '../../hooks';
import { ErrorFallback } from '../error-fallback';
import { useStyles } from './BlockItem.style';
import { useGetAriaLabelOfBlockItem } from './hooks/useGetAriaLabelOfBlockItem';
import { useCollection } from '../../../data-source';
import { BlockLinkageRuleProvider } from '../../../modules/blocks/BlockLinkageRuleProvider';

export interface BlockItemProps {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const BlockItem: React.FC<BlockItemProps> = withDynamicSchemaProps(
  (props) => {
    // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
    const { className, children, style } = useProps(props);
    const { componentCls, hashId } = useStyles();
    const fieldSchema = useFieldSchema();
    const { render } = useSchemaToolbarRender(fieldSchema);
    const { getAriaLabel } = useGetAriaLabelOfBlockItem(props.name);
    const label = useMemo(() => getAriaLabel(), [getAriaLabel]);
    const collection = useCollection();
    const markdownField = fieldSchema['x-decorator'] === 'FormItem' && fieldSchema['x-block-linkage-rules'];
    const content = (
      <SortableItem
        role="button"
        aria-label={label}
        className={cls('nb-block-item', className, componentCls, hashId)}
        style={style}
      >
        {render()}
        <ErrorBoundary FallbackComponent={ErrorFallback} onError={console.log}>
          {children}
        </ErrorBoundary>
      </SortableItem>
    );

    return collection && !markdownField ? content : <BlockLinkageRuleProvider>{content}</BlockLinkageRuleProvider>;
  },
  { displayName: 'BlockItem' },
);
