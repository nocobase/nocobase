import { css } from '@emotion/css';
import moment from 'moment';

import { connect, mapProps } from '@formily/react';
import { useBoolean } from 'ahooks';
import { Input, Radio, Space } from 'antd';
import React, { useState } from 'react';
import { useToken } from '../../';

const date = moment();

const spaceCSS = css`
  width: 100%;
  & > .ant-space-item {
    flex: 1;
  }
`;
export const DateFormatCom = (props?) => {
  const date = moment();
  return (
    <div style={{ display: 'inline-flex' }}>
      <span>{props.format}</span>
      <DateTimeFormatPreview content={date.format(props.format)} />
    </div>
  );
};

const DateTimeFormatPreview = ({ content }) => {
  const { token } = useToken();
  return (
    <span
      style={{
        display: 'inline-block',
        background: token.colorBgTextHover,
        marginLeft: token.marginMD,
        lineHeight: '1',
        padding: token.paddingXXS,
        borderRadius: token.borderRadiusOuter,
      }}
    >
      {content}
    </span>
  );
};

const InternalExpiresRadio = (props) => {
  const { onChange, defaultValue, formats } = props;
  const [isCustom, { setFalse, setTrue }] = useBoolean(!formats.includes(props.value));
  const targetValue = !formats.includes(props.value) ? props.value : defaultValue;
  const [customFormatPreview, setCustomFormatPreview] = useState(date.format(targetValue));
  const onSelectChange = (v) => {
    if (v.target.value === 'custom') {
      setTrue();
      onChange(targetValue);
    } else {
      setFalse();
      onChange(v.target.value);
    }
  };
  return (
    <Space className={spaceCSS}>
      <Radio.Group value={isCustom ? 'custom' : props.value} onChange={onSelectChange}>
        <Space direction="vertical">
          {props.options.map((v) => {
            if (v.value === 'custom') {
              return (
                <Radio value={v.value}>
                  <Input
                    style={{ width: '150px' }}
                    defaultValue={targetValue}
                    onChange={(e) => {
                      if (e.target.value && moment(date.toLocaleString(), e.target.value).isValid()) {
                        setCustomFormatPreview(date.format(e.target.value));
                      } else {
                        setCustomFormatPreview(null);
                      }
                      onChange(e.target.value);
                    }}
                  />
                  <DateTimeFormatPreview content={customFormatPreview} />
                </Radio>
              );
            }
            return <Radio value={v.value}>{v.label}</Radio>;
          })}
        </Space>
      </Radio.Group>
    </Space>
  );
};

const ExpiresRadio = connect(
  InternalExpiresRadio,
  mapProps({
    dataSource: 'options',
  }),
);

export { ExpiresRadio };
