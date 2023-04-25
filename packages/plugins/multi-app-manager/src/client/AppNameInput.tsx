import { connect, mapReadPretty } from '@formily/react';
import { Input as AntdInput } from 'antd';
import React from 'react';

const ReadPretty = (props) => {
  const content = props.value && (
    <a target={'_blank'} href={`/apps/${props.value}/admin`} rel="noreferrer">
      {props.value}
    </a>
  );
  return (
    <div style={props.style}>
      {props.addonBefore}
      {props.prefix}
      {content}
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

export const AppNameInput = connect(AntdInput, mapReadPretty(ReadPretty));
