/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { usePrefixCls } from '@formily/antd-v5/esm/__builtins__';
import { useFieldSchema } from '@formily/react';
import { Image, Typography } from 'antd';
import cls from 'classnames';
import React from 'react';
import { useCompile } from '../../hooks';
import { EllipsisWithTooltip } from './EllipsisWithTooltip';
import { HTMLEncode } from './shared';

export type InputReadPrettyComposed = {
  Input: React.FC<InputReadPrettyProps>;
  URL: React.FC<URLReadPrettyProps>;
  Preview: React.FC<URLReadPrettyProps>;
  TextArea: React.FC<TextAreaReadPrettyProps>;
  Html: React.FC<HtmlReadPrettyProps>;
  JSON: React.FC<JSONTextAreaReadPrettyProps>;
};

export const ReadPretty: InputReadPrettyComposed = () => null;

export interface InputReadPrettyProps {
  value?: any;
  className?: string;
  style?: React.CSSProperties;
  addonBefore?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonAfter?: React.ReactNode;
  ellipsis?: boolean;
  prefixCls?: string;
}

ReadPretty.Input = (props: InputReadPrettyProps) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prefixCls = usePrefixCls('description-input', props);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const compile = useCompile();
  return (
    <div
      className={cls(prefixCls, props.className)}
      style={{ ...props.style, overflowWrap: 'break-word', whiteSpace: 'normal' }}
    >
      {props.addonBefore}
      {props.prefix}
      <EllipsisWithTooltip ellipsis={props.ellipsis}>
        {props.value && typeof props.value === 'object' ? JSON.stringify(props.value) : compile(props.value)}
      </EllipsisWithTooltip>
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

export interface TextAreaReadPrettyProps {
  value?: any;
  className?: string;
  style?: React.CSSProperties;
  addonBefore?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonAfter?: React.ReactNode;
  ellipsis?: boolean;
  text?: boolean;
  autop?: boolean;
  prefixCls?: string;
}

ReadPretty.TextArea = (props) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prefixCls = usePrefixCls('description-textarea', props);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const compile = useCompile();
  const value = compile(props.value ?? '');
  const { autop = true, ellipsis, text } = props;
  const html = (
    <div
      style={{ lineHeight: 1.612 }}
      dangerouslySetInnerHTML={{
        __html: HTMLEncode(value).split('\n').join('<br/>'),
      }}
    />
  );

  const content = ellipsis ? (
    <EllipsisWithTooltip ellipsis={ellipsis} popoverContent={autop ? html : value}>
      {text || value}
    </EllipsisWithTooltip>
  ) : autop ? (
    html
  ) : (
    value
  );
  return (
    <div className={cls(prefixCls, props.className)} style={{ overflowWrap: 'break-word', ...props.style }}>
      {props.addonBefore}
      {props.prefix}
      {content}
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

function convertToText(html: string) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const text = temp.innerText;
  return text?.replace(/[\n\r]/g, '') || '';
}

export interface HtmlReadPrettyProps {
  value?: any;
  className?: string;
  style?: React.CSSProperties;
  addonBefore?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonAfter?: React.ReactNode;
  ellipsis?: boolean;
  autop?: boolean;
  prefixCls?: string;
}

ReadPretty.Html = (props) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prefixCls = usePrefixCls('description-textarea', props);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const compile = useCompile();
  const value = compile(props.value ?? '');
  const { autop = true, ellipsis } = props;
  const html = (
    <div
      style={{ lineHeight: '1.42' }}
      dangerouslySetInnerHTML={{
        __html: value,
      }}
    />
  );
  const text = convertToText(value);
  const content = (
    <EllipsisWithTooltip ellipsis={ellipsis} popoverContent={autop ? html : value}>
      {ellipsis ? text : html}
    </EllipsisWithTooltip>
  );
  return (
    <div className={cls(prefixCls, props.className)} style={{ overflowWrap: 'break-word', ...props.style }}>
      {props.addonBefore}
      {props.prefix}
      {content}
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

export interface URLReadPrettyProps {
  value?: any;
  className?: string;
  style?: React.CSSProperties;
  addonBefore?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonAfter?: React.ReactNode;
  prefixCls?: string;
  ellipsis?: boolean;
}

ReadPretty.URL = (props: URLReadPrettyProps) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prefixCls = usePrefixCls('description-url', props);
  const content = props.value && (
    <Typography.Link ellipsis={props.ellipsis} target={'_blank'} href={props.value as any}>
      {props.value}
    </Typography.Link>
  );
  return (
    <div className={cls(prefixCls, props.className)} style={{ whiteSpace: 'normal', ...props.style }}>
      {props.addonBefore}
      {props.prefix}
      {content}
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

ReadPretty.Preview = function Preview(props: any) {
  const fieldSchema = useFieldSchema();
  const size = fieldSchema['x-component-props']?.['size'] || 'small';
  if (!props.value) {
    return props.value;
  }
  const sizes = {
    small: 24,
    middle: 48,
    large: 72,
  };
  return (
    <Image
      style={
        ['small', 'middle', 'large'].includes(size)
          ? {
              width: sizes[size],
              height: sizes[size],
              objectFit: 'cover',
            }
          : {}
      }
      src={props.value}
    />
  );
};

export interface JSONTextAreaReadPrettyProps {
  value?: any;
  className?: string;
  style?: React.CSSProperties;
  space?: number;
  prefixCls?: string;
  ellipsis?: boolean;
}

ReadPretty.JSON = (props: JSONTextAreaReadPrettyProps) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prefixCls = usePrefixCls('json', props);
  const content = props.value != null ? JSON.stringify(props.value, null, props.space ?? 2) : '';
  const JSONContent = (
    <pre
      className={cx(
        prefixCls,
        props.className,
        css`
          margin-bottom: 0;
          line-height: 1.5;
          font-size: 90%;
        `,
      )}
      style={props.style}
    >
      {content}
    </pre>
  );

  if (props.ellipsis) {
    return (
      <EllipsisWithTooltip ellipsis={props.ellipsis} popoverContent={JSONContent}>
        <Typography.Text>{content}</Typography.Text>
      </EllipsisWithTooltip>
    );
  }

  return JSONContent;
};
