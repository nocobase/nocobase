import { usePrefixCls } from '@formily/antd/lib/__builtins__';
import { Popover } from 'antd';
import { InputProps, TextAreaProps } from 'antd/lib/input';
import cls from 'classnames';
import React, { useEffect, useState } from 'react';
import { useCompile } from '../../hooks/useCompile';

type Composed = {
  Input: React.FC<InputProps & { ellipsis?: any }>;
  URL: React.FC<InputProps>;
  TextArea: React.FC<TextAreaProps & { ellipsis?: any; text?: any; addonBefore?: any; suffix?: any; addonAfter?: any }>;
};

export const ReadPretty: Composed = () => null;

ReadPretty.Input = (props) => {
  const prefixCls = usePrefixCls('description-input', props);
  const domRef = React.useRef<HTMLInputElement>(null);
  const compile = useCompile();
  const [ellipsis, setEllipsis] = useState(false);
  const content = compile(props.value);
  const ellipsisContent = (
    <Popover content={content} style={{ width: 100 }}>
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

ReadPretty.TextArea = (props) => {
  const prefixCls = usePrefixCls('description-textarea', props);
  const domRef = React.useRef<HTMLInputElement>(null);
  const [ellipsis, setEllipsis] = useState(false);
  const ellipsisProp = props.ellipsis === true ? {} : props.ellipsis;
  const ellipsisContent = (
    <Popover content={props.value}>
      <span
        className={'input-ellipsis'}
        style={{
          ...ellipsisProp,
        }}
      >
        {props.text || props.value}
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
      <span ref={domRef}>{ellipsis ? ellipsisContent : props.value}</span>
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
