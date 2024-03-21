import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Input as AntdInput } from 'antd';
import cls from 'classnames';
import { useCollectionRecord } from '@nocobase/client';
import { usePrefixCls } from '@formily/antd-v5/esm/__builtins__';

const ReadPretty = (props) => {
  const prefixCls = usePrefixCls('description-input', props);
  const {
    data: { name, tableName },
  } = useCollectionRecord() as any;
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {name !== tableName ? (
        <>
          {name} <span style={{ color: 'GrayText' }}>({tableName})</span>
        </>
      ) : (
        props.value
      )}
    </div>
  );
};
export const CollectionName = Object.assign(
  connect(
    AntdInput,
    mapProps((props, field) => {
      return {
        ...props,
        suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
      };
    }),
    mapReadPretty(ReadPretty),
  ),
);
