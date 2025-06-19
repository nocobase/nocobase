/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import dayjs from 'dayjs';
import { connect, mapProps } from '@formily/react';
import { useBoolean } from 'ahooks';
import { Input, Radio, Space, theme } from 'antd';
import React, { useEffect, useState } from 'react';

const date = dayjs();

const spaceCSS = css`
  width: 100%;
  & > .ant-space-item {
    flex: 1;
  }
`;
const DateFormatCom = (props?) => {
  const date = dayjs();
  return (
    <div style={{ display: 'inline-flex' }}>
      <span>{props.format}</span>
      <DateTimeFormatPreview content={date.format(props.format)} />
    </div>
  );
};

const DateTimeFormatPreview = ({ content }) => {
  const { token } = theme.useToken();
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
  const { onChange, defaultValue, formats, picker } = props;
  const [isCustom, { setFalse, setTrue }] = useBoolean(props.value && !formats.includes(props.value));
  const [targetValue, setTargetValue] = useState(
    props.value && !formats.includes(props.value) ? props.value : defaultValue,
  );
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
  useEffect(() => {
    if (!formats.includes(props.value)) {
      setTrue();
    } else {
      setFalse();
    }
    setTargetValue(props.value && !formats.includes(props.value) ? props.value : defaultValue);
  }, [props.value]);

  useEffect(() => {
    setCustomFormatPreview(targetValue ? date.format(targetValue) : null);
  }, [targetValue]);

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
                    value={targetValue}
                    onChange={(e) => {
                      if (e.target.value) {
                        setCustomFormatPreview(date.format(e.target.value));
                      } else {
                        setCustomFormatPreview(null);
                      }
                      if (isCustom) {
                        onChange(e.target.value);
                      }
                      setTargetValue(e.target.value);
                    }}
                  />
                  <DateTimeFormatPreview content={customFormatPreview} />
                </Radio>
              );
            }
            if (!picker || picker === 'date') {
              return (
                <Radio value={v.value} key={v.value} aria-label={v.value}>
                  <span role="button" aria-label={v.value}>
                    {v.label}
                  </span>
                </Radio>
              );
            }
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

export { ExpiresRadio, DateFormatCom };
