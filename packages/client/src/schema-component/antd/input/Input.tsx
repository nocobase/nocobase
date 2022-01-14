import { LoadingOutlined } from '@ant-design/icons';
import { usePrefixCls } from '@formily/antd/esm/__builtins__';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Input as AntdInput, Popover } from 'antd';
import { InputProps, TextAreaProps } from 'antd/lib/input';
import cls from 'classnames';
import React, { useEffect, useState } from 'react';
import { useCompile } from '../../../hooks/useCompile';
import { usePlaceholder } from '../hooks/usePlaceholder';

type ComposedInput = React.FC<InputProps> & {
  TextArea?: React.FC<TextAreaProps>;
  URL?: React.FC<InputProps>;
  DesignableBar?: React.FC<any>;
};

export const InputDisplay: React.FC<InputProps & { ellipsis: any }> = (props) => {
  const prefixCls = usePrefixCls('description-input', props);
  const domRef = React.useRef<HTMLInputElement>(null);
  const compile = useCompile();
  const [ellipsis, setEllipsis] = useState(false);
  const content = compile(usePlaceholder(props.value));
  const ellipsisContent = (
    <Popover content={usePlaceholder(props.value)} style={{ width: 100 }}>
      <span className={'input-ellipsis'}>{content}</span>
    </Popover>
  );
  useEffect(() => {
    if (domRef.current?.scrollWidth > domRef.current?.clientWidth) {
      setEllipsis(true);
    }
  }, []);
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {props.addonBefore}
      {props.prefix}
      <span ref={domRef}>{ellipsis ? ellipsisContent : content}</span>
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};
export const Input: ComposedInput = connect(
  AntdInput,
  mapProps((props, field) => {
    return {
      ...props,
      suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
    };
  }),
  mapReadPretty(InputDisplay),
);

export const TextAreaDisplay: React.FC<any> = (props) => {
  const prefixCls = usePrefixCls('description-textarea', props);
  const domRef = React.useRef<HTMLInputElement>(null);
  const [ellipsis, setEllipsis] = useState(false);
  const ellipsisProp = props.ellipsis === true ? {} : props.ellipsis;
  const content = usePlaceholder(props.value);
  const ellipsisContent = (
    <Popover content={usePlaceholder(props.value)}>
      <span
        className={'input-ellipsis'}
        style={{
          ...ellipsisProp,
        }}
      >
        {usePlaceholder(props.text || props.value)}
      </span>
    </Popover>
  );
  useEffect(() => {
    if (domRef.current?.scrollWidth > domRef.current?.clientWidth) {
      setEllipsis(true);
    }
  }, []);
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {props.addonBefore}
      {props.prefix}
      <span ref={domRef}>{ellipsis ? ellipsisContent : content}</span>
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};
Input.TextArea = connect(AntdInput.TextArea, mapReadPretty(TextAreaDisplay));

const URLDisplay: React.FC<InputProps> = (props) => {
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
Input.URL = connect(AntdInput, mapReadPretty(URLDisplay));

export default Input;
