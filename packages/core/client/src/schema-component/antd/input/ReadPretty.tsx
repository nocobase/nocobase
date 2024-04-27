import { css, cx } from '@emotion/css';
import { usePrefixCls } from '@formily/antd-v5/esm/__builtins__';
import { Typography } from 'antd';
import { InputProps as AntdInputProps, TextAreaProps as AntdTextAreaProps } from 'antd/es/input';
import cls from 'classnames';
import React from 'react';
import { EllipsisWithTooltip } from './EllipsisWithTooltip';
import { HTMLEncode } from './shared';
import { JSONTextAreaProps } from './Json';
import { useCompile } from '../../hooks';

export interface InputProps extends AntdInputProps {
  ellipsis?: boolean;
}

export interface InputHtml extends AntdInputProps {
  ellipsis?: boolean;
  autop?: boolean;
}

export interface InputTextAreaProps extends AntdTextAreaProps {
  ellipsis?: boolean;
  text?: boolean;
  addonBefore?: any;
  suffix?: React.ReactNode;
  addonAfter?: React.ReactNode;
  /**
   * Whether to automatically process text content
   * @default true
   */
  autop?: boolean;
}

type Composed = {
  Input: React.FC<InputProps>;
  URL: React.FC<InputProps>;
  TextArea: React.FC<InputTextAreaProps>;
  Html: React.FC<InputHtml>;
  JSON: React.FC<JSONTextAreaProps>;
};

export const ReadPretty: Composed = () => null;

ReadPretty.Input = (props: InputProps) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prefixCls = usePrefixCls('description-input', props);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const compile = useCompile();
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {props.addonBefore}
      {props.prefix}
      <EllipsisWithTooltip ellipsis={props.ellipsis}>{compile(props.value)}</EllipsisWithTooltip>
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

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

ReadPretty.URL = (props) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prefixCls = usePrefixCls('description-url', props);
  const content = props.value && (
    <Typography.Link ellipsis target={'_blank'} href={props.value as any}>
      {props.value}
    </Typography.Link>
  );
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {props.addonBefore}
      {props.prefix}
      {content}
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

ReadPretty.JSON = (props) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prefixCls = usePrefixCls('json', props);
  return (
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
      {props.value != null ? JSON.stringify(props.value, null, props.space ?? 2) : ''}
    </pre>
  );
};
