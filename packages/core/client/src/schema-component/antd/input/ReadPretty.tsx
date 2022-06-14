import { usePrefixCls } from '@formily/antd/lib/__builtins__';
import { InputProps, TextAreaProps } from 'antd/lib/input';
import cls from 'classnames';
import React from 'react';
import { useCompile } from '../..';
import { EllipsisWithTooltip } from './EllipsisWithTooltip';
import { HTMLEncode } from './shared';

type Composed = {
  Input: React.FC<InputProps & { ellipsis?: any }>;
  URL: React.FC<InputProps>;
  TextArea: React.FC<
    TextAreaProps & { ellipsis?: any; text?: any; addonBefore?: any; suffix?: any; addonAfter?: any; autop?: boolean }
  >;
  Html?: any;
};

export const ReadPretty: Composed = () => null;

ReadPretty.Input = (props) => {
  const prefixCls = usePrefixCls('description-input', props);
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
  const prefixCls = usePrefixCls('description-textarea', props);
  const compile = useCompile();
  const value = compile(props.value ?? '');
  const { autop = true, ellipsis, text } = props;
  const html = (
    <div
      style={{lineHeight: 1.612}}
      dangerouslySetInnerHTML={{
        __html: HTMLEncode(value).split('\n').join('<br/>'),
      }}
    />
  );

  const content = ellipsis ?
    (<EllipsisWithTooltip ellipsis={ellipsis} popoverContent={autop ? html : value}>
      {text || value}
    </EllipsisWithTooltip>) : (autop ? html : value);
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

function convertToText(html: string) {
  let temp = document.createElement('div');
  temp.innerHTML = html;
  const text = temp.innerText;
  temp = null;
  return text.replace(/[\n\r]/g, '');
}

ReadPretty.Html = (props) => {
  const prefixCls = usePrefixCls('description-textarea', props);
  const compile = useCompile();
  const value = compile(props.value ?? '');
  const { autop = true, ellipsis } = props;
  const html = (
    <div
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
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {props.addonBefore}
      {props.prefix}
      {content}
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

ReadPretty.URL = (props) => {
  const prefixCls = usePrefixCls('description-url', props);
  const content = props.value && (
    <a target={'_blank'} href={props.value as any}>
      {props.value}
    </a>
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
