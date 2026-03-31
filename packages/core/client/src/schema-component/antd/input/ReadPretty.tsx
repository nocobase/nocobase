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
import { Image } from 'antd';
import cls from 'classnames';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { withPopupWrapper } from '../../common/withPopupWrapper';
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
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const content = useMemo(() => {
    if (Array.isArray(props.value)) {
      return props.value.join(',');
    }

    return props.value && typeof props.value === 'object' ? JSON.stringify(props.value) : compile(props.value);
  }, [props.value]);

  const flexStyle = props.ellipsis ? { display: 'flex', alignItems: 'center' } : {};

  return (
    <div
      className={cls(prefixCls, props.className)}
      style={{
        ...flexStyle,
        overflowWrap: 'break-word',
        whiteSpace: 'normal',
        ...props.style,
      }}
    >
      {compile(props.addonBefore)}
      {compile(props.prefix)}
      {props.ellipsis ? <EllipsisWithTooltip ellipsis={props.ellipsis}>{content}</EllipsisWithTooltip> : content}
      {compile(props.suffix)}
      {compile(props.addonAfter)}
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

const toHTML = _.memoize((value: string) => ({ __html: HTMLEncode(value).split('\n').join('<br/>') }));
const lineHeight = { lineHeight: 'inherit' };
const html = (value: string) => <div style={lineHeight} dangerouslySetInnerHTML={toHTML(value)} />;

ReadPretty.TextArea = (props) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prefixCls = usePrefixCls('description-textarea', props);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const compile = useCompile();
  const { autop: atop = true, ellipsis, text } = props;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const content = useMemo(() => {
    const value = compile(props.value ?? '');

    return ellipsis ? (
      <EllipsisWithTooltip ellipsis={ellipsis} popoverContent={atop ? html(value) : value}>
        {text || value}
      </EllipsisWithTooltip>
    ) : atop ? (
      html(value)
    ) : (
      value
    );
  }, [atop, ellipsis, props.value, text]);

  return (
    <div
      className={cls(prefixCls, props.className)}
      style={{ overflowWrap: 'break-word', whiteSpace: 'normal', ...props.style }}
    >
      {props.addonBefore}
      {props.prefix}
      {content}
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

const convertToText = _.memoize((html: string) => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const text = temp.innerText;
  return text?.replace(/[\n\r]/g, '') || '';
});

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

const lineHeight142 = { lineHeight: '1.42' };
ReadPretty.Html = (props) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prefixCls = usePrefixCls('description-textarea', props);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const compile = useCompile();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const content = useMemo(() => {
    const value = compile(props.value ?? '');
    const { autop = true, ellipsis } = props;
    const html = (
      <div
        style={lineHeight142}
        dangerouslySetInnerHTML={{
          __html: value,
        }}
      />
    );
    const text = convertToText(value);

    if (ellipsis) {
      return (
        <EllipsisWithTooltip ellipsis={ellipsis} popoverContent={autop ? html : value}>
          {text}
        </EllipsisWithTooltip>
      );
    }

    return autop ? html : value;
  }, [props.value]);

  return (
    <div
      className={cls(prefixCls, props.className)}
      style={{ overflowWrap: 'break-word', whiteSpace: 'normal', ...props.style }}
    >
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

const ellipsisStyle = { textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' };

ReadPretty.URL = (props: URLReadPrettyProps) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prefixCls = usePrefixCls('description-url', props);
  const content = props.value && (
    <a style={props.ellipsis ? ellipsisStyle : undefined} target="_blank" rel="noopener noreferrer" href={props.value}>
      {props.value}
    </a>
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

const sizes = {
  small: 24,
  middle: 48,
  large: 72,
  oversized: 120,
};

ReadPretty.Preview = function Preview(props: any) {
  const fieldSchema = useFieldSchema();
  const size = fieldSchema['x-component-props']?.['size'] || 'small';
  const objectFit = fieldSchema['x-component-props']?.['objectFit'] || 'cover';

  if (!props.value) {
    return props.value;
  }

  return (
    <Image
      style={
        ['small', 'middle', 'large', 'oversized'].includes(size)
          ? {
              width: sizes[size],
              height: sizes[size],
              objectFit,
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

const JSONClassName = css`
  margin-bottom: 0;
  line-height: 1.5;
  font-size: 90%;
`;

ReadPretty.JSON = (props: JSONTextAreaReadPrettyProps) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prefixCls = usePrefixCls('json', props);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const content = useMemo(
    () => (props.value != null ? JSON.stringify(props.value, null, props.space ?? 2) : ''),
    [props.space, props.value],
  );
  const JSONContent = (
    <pre className={cx(prefixCls, props.className, JSONClassName)} style={props.style}>
      {content}
    </pre>
  );

  if (props.ellipsis) {
    return (
      <EllipsisWithTooltip ellipsis={props.ellipsis} popoverContent={JSONContent}>
        {content}
      </EllipsisWithTooltip>
    );
  }

  return JSONContent;
};

ReadPretty.Input = withPopupWrapper(ReadPretty.Input);
ReadPretty.TextArea = withPopupWrapper(ReadPretty.TextArea);
ReadPretty.Html = withPopupWrapper(ReadPretty.Html);
ReadPretty.Preview = withPopupWrapper(ReadPretty.Preview);
ReadPretty.JSON = withPopupWrapper(ReadPretty.JSON);
