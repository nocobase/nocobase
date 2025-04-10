/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { useFieldSchema } from '@formily/react';
import { CardProps } from 'antd';
import { useSchemaTemplate } from '../../../schema-templates';
import { BlockItem } from '../block-item';
import { BlockItemCard } from '../block-item/BlockItemCard';
import { BlockItemError } from '../block-item/BlockItemError';
import useStyles from './style';
import { useCollection } from '../../../data-source';
import { BlockLinkageRuleProvider } from '../../../modules/blocks/BlockLinkageRuleProvider';

export interface CardItemProps extends CardProps {
  name?: string;
  children?: React.ReactNode;
  heightMode?: string;
  height?: number;
}

export const CardItem: FC<CardItemProps> = ({ children, name, heightMode, ...restProps }) => {
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const templateKey = fieldSchema?.['x-template-key'];
  const { wrapSSR, componentCls, hashId } = useStyles();
  const collection = useCollection();

  // 如果有 templateKey 则不渲染
  if (templateKey && !template) return null;

  const cardContent = (
    <BlockItem name={name} className={`${componentCls} ${hashId} noco-card-item`}>
      <BlockItemCard {...restProps}>{children}</BlockItemCard>
    </BlockItem>
  );

  return wrapSSR(
    <BlockItemError>
      {collection ? cardContent : <BlockLinkageRuleProvider>{cardContent}</BlockLinkageRuleProvider>}
    </BlockItemError>,
  );
};
