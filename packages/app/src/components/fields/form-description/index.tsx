import React from 'react';
import { createVirtualBox } from '@formily/react-schema-renderer';
import { Card } from 'antd';
import styled from 'styled-components';
import { markdown } from '@/components/views/Field';

export const FormDescription = createVirtualBox(
  'description',
  styled(({ schema = {}, children, className, ...props }) => {
    const { title, tooltip } = schema as any;
    console.log({ schema });
    return (
      <Card
        title={title}
        size={'small'}
        headStyle={{ padding: 0 }}
        bodyStyle={{
          padding: 0,
        }}
        className={className}
        {...props}
      >
        {typeof tooltip === 'string' && tooltip && (
          <div dangerouslySetInnerHTML={{ __html: markdown(tooltip) }}></div>
        )}
      </Card>
    );
  })`
    margin-bottom: 24px !important;
    &.ant-card {
      border: none;
      box-shadow: none;
      .ant-card-head {
        font-size: 16px;
        background: #fafafa;
        margin: 0 -24px;
        padding: 4px 24px !important;
        border-top: 1px solid #f0f0f0;
      }
      p:first-child {
        margin-top: 14px;
      }
      p:last-child {
        margin-bottom: 0;
      }
    }
  `,
);

export default FormDescription;
