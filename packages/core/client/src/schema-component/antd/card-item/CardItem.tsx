/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { Skeleton, CardProps } from 'antd';
import React, { FC } from 'react';
import { IntersectionOptions, useInView } from 'react-intersection-observer';
import { useSchemaTemplate } from '../../../schema-templates';
import { BlockItem } from '../block-item';
import { BlockItemCard } from '../block-item/BlockItemCard';
import { BlockItemError } from '../block-item/BlockItemError';
import useStyles from './style';

export interface CardItemProps extends CardProps {
  name?: string;
  children?: React.ReactNode;
  /**
   * lazy render options
   * @default { threshold: 0, initialInView: true, triggerOnce: true }
   * @see https://github.com/thebuilder/react-intersection-observer
   */
  lazyRender?: IntersectionOptions & { element?: React.JSX.Element };
  heightMode?: string;
  height?: number;
}

export const CardItem: FC<CardItemProps> = (props) => {
  const { children, name, lazyRender = {}, heightMode, ...restProps } = props;
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const templateKey = fieldSchema?.['x-template-key'];
  const { element: lazyRenderElement, ...resetLazyRenderOptions } = lazyRender;
  const { ref, inView } = useInView({
    threshold: 0,
    initialInView: true,
    triggerOnce: true,
    skip: !!process.env.__E2E__,
    ...resetLazyRenderOptions,
  });
  const { wrapSSR, componentCls, hashId } = useStyles();

  if (templateKey && !template) return null;
  return wrapSSR(
    <BlockItemError>
      <BlockItem name={name} className={`${componentCls} ${hashId} noco-card-item`}>
        <BlockItemCard ref={ref} {...restProps}>
          {inView ? props.children : lazyRenderElement ?? <Skeleton paragraph={{ rows: 4 }} />}
        </BlockItemCard>
      </BlockItem>
    </BlockItemError>,
  );
};
