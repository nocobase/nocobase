import { useFieldSchema } from '@formily/react';
import { Card, Skeleton } from 'antd';
import React from 'react';
import { useSchemaTemplate } from '../../../schema-templates';
import { BlockItem } from '../block-item';
import { useInView } from 'react-intersection-observer';
import { BlockItemCard } from '../block-item/BlockItemCard';
import { BlockItemError } from '../block-item/BlockItemError';

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

  if (templateKey && !template) return null;
  return (
    <BlockItemError>
      <BlockItem name={name}>
        <BlockItemCard ref={ref} {...restProps}>
          {inView ? props.children : <Skeleton active paragraph={{ rows: 4 }} />}
        </BlockItemCard>
      </BlockItem>
    </BlockItemError>
  );
};
