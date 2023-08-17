import { useForm } from '@formily/react';
import { useAsyncData } from '../../../../async-data-provider';
import React from 'react';
import { SchemaComponent } from '../../../../schema-component';
import { css } from '@emotion/css';
import { Button } from 'antd';
import { RightSquareOutlined } from '@ant-design/icons';

export const SQLInput = () => {
  const { run, loading } = useAsyncData();
  const form = useForm();
  const execute = () => {
    if (!form.values.sql) {
      return;
    }
    run(form.values.sql);
  };

  return (
    <div
      className={css`
        position: relative;
        .ant-input {
          width: 100%;
        }
      `}
    >
      <SchemaComponent
        schema={{
          type: 'void',
          properties: {
            sql: {
              type: 'string',
              'x-component': 'Input.TextArea',
              'x-component-props': {
                onBlur: () => execute(),
              },
            },
          },
        }}
      />
      <Button.Group
        className={css`
          position: absolute;
          right: 0;
          top: 0;
          .ant-btn-sm {
            font-size: 85%;
          }
        `}
      >
        <Button
          onClick={() => execute()}
          loading={loading}
          ghost
          size="small"
          type="primary"
          icon={<RightSquareOutlined />}
        />
      </Button.Group>
    </div>
  );
};
