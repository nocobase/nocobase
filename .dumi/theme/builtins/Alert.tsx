import React from 'react';
import './Alert.less';
import { Alert } from 'antd';
import micromark from 'micromark'

export default (props: any) => {
  const { title, children, ...others } = props;
  console.log({children});
  return (
    <div className="__dumi-default-alert" {...others}>
      {title && (
        <p className={'__dumi-default-alert-title'}>{title}</p>
      )}
      {typeof children === 'string' ? <div dangerouslySetInnerHTML={{__html: micromark(`\n ${children} \n`)}}/> : children}
    </div>
  )
};
