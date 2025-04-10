/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { CardProps } from 'antd';
import React, { FC } from 'react';
import { useSchemaTemplate } from '../../../schema-templates';
import { BlockItem } from '../block-item';
import { BlockItemCard } from '../block-item/BlockItemCard';
import { BlockItemError } from '../block-item/BlockItemError';
import useStyles from './style';

export interface CardItemProps extends CardProps {
  name?: string;
  children?: React.ReactNode;
  heightMode?: string;
  height?: number;
}

export const CardItem: FC<CardItemProps> = (props) => {
  const { children, name, heightMode, ...restProps } = props;
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const templateKey = fieldSchema?.['x-template-key'];
  const { wrapSSR, componentCls, hashId } = useStyles();

  if (templateKey && !template) return null;
  return wrapSSR(
    <BlockItemError>
      <BlockItem name={name} className={`${componentCls} ${hashId} noco-card-item`}>
        <BlockItemCard {...restProps}>{props.children}</BlockItemCard>
      </BlockItem>
    </BlockItemError>,
  );
};
