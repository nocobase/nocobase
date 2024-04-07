import { useFieldSchema } from '@formily/react';
import { Card, Skeleton } from 'antd';
import React from 'react';
import { useSchemaTemplate } from '../../../schema-templates';
import { BlockItem } from '../block-item';
import useStyles from './style';
import { useInView } from 'react-intersection-observer';

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
  const { wrapSSR, componentCls, hashId } = useStyles();
  const { ref, inView } = useInView({
    threshold: 0,
    initialInView: true,
    triggerOnce: true,
    skip: !!process.env.__E2E__,
  });

  return wrapSSR(
    templateKey && !template ? null : (
      <BlockItem name={name} className={`${componentCls} ${hashId} noco-card-item`}>
        <Card ref={ref} className="card" bordered={false} {...restProps}>
          {inView ? props.children : <Skeleton active paragraph={{ rows: 4 }} />}
        </Card>
      </BlockItem>
    ),
  );
};
