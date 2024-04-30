/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { Skeleton } from 'antd';
import React from 'react';
import { useInView } from 'react-intersection-observer';
import { useSchemaTemplate } from '../../../schema-templates';
import { BlockItem } from '../block-item';
import { BlockItemCard } from '../block-item/BlockItemCard';
import { BlockItemError } from '../block-item/BlockItemError';
import useStyles from './style';

interface Props {
  children?: React.ReactNode;
  /** 区块标识 */
  name?: string;
  [key: string]: any;
}

export const CardItem = (props: Props) => {
  const { children, name, ...restProps } = props;
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const templateKey = fieldSchema?.['x-template-key'];
  const { ref, inView } = useInView({
    threshold: 0,
    initialInView: true,
    triggerOnce: true,
    skip: !!process.env.__E2E__,
  });
  const { wrapSSR, componentCls, hashId } = useStyles();

  if (templateKey && !template) return null;
  return wrapSSR(
    <BlockItemError>
      <BlockItem name={name} className={`${componentCls} ${hashId} noco-card-item`}>
        <BlockItemCard ref={ref} {...restProps}>
          {inView ? props.children : <Skeleton paragraph={{ rows: 4 }} />}
        </BlockItemCard>
      </BlockItem>
    </BlockItemError>,
  );
};
