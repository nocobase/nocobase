import { useFieldSchema } from '@formily/react';
import { Card } from 'antd';
import React from 'react';
import { useSchemaTemplate } from '../../../schema-templates';
import { BlockItem } from '../block-item';
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
  const { wrapSSR, componentCls, hashId } = useStyles();
  return wrapSSR(
    templateKey && !template ? null : (
      <BlockItem name={name} className={`${componentCls} ${hashId} noco-card-item`}>
        <Card className="card" bordered={false} {...restProps}>
          {props.children}
        </Card>
      </BlockItem>
    ),
  );
};
