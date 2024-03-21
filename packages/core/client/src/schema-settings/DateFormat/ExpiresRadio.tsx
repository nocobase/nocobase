import { css } from '@emotion/css';
import dayjs from 'dayjs';

import { connect, mapProps } from '@formily/react';
import { useBoolean } from 'ahooks';
import { Input, Radio, Space } from 'antd';
import React, { useState } from 'react';
import { useToken } from '../../';

const date = dayjs();

const spaceCSS = css`
  width: 100%;
  & > .ant-space-item {
    flex: 1;
  }
`;
export const DateFormatCom = (props?) => {
  const date = dayjs();
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
  const { onChange, defaultValue, formats, timeFormat } = props;
  const [isCustom, { setFalse, setTrue }] = useBoolean(props.value && !formats.includes(props.value));
  const targetValue = props.value && !formats.includes(props.value) ? props.value : defaultValue;
  const [customFormatPreview, setCustomFormatPreview] = useState(targetValue ? date.format(targetValue) : null);
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
                <Radio value={v.value} key={v.value}>
                  <Input
                    style={{ width: '150px' }}
                    defaultValue={targetValue}
                    onChange={(e) => {
                      if (e.target.value) {
                        setCustomFormatPreview(date.format(e.target.value));
                      } else {
                        setCustomFormatPreview(null);
                      }
                      if (isCustom) {
                        onChange(e.target.value);
                      }
                    }}
                  />
                  <DateTimeFormatPreview content={customFormatPreview} />
                </Radio>
              );
            }
            return (
              <Radio value={v.value} key={v.value} aria-label={v.value}>
                <span role="button" aria-label={v.value}>
                  {v.label}
                </span>
              </Radio>
            );
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
