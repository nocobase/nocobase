import React from 'react';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { markdown } from '../Field';

export default {
  text(...args: any[]) {
    return React.createElement('span', {}, ...args)
  },
  html(html: string) {
    const text = decodeURIComponent(html);
    return <div dangerouslySetInnerHTML={{__html: markdown(text)}}></div>
  },
  markdown(text: string) {
    return <span dangerouslySetInnerHTML={{__html: markdown(text)}}></span>
  },
  tooltip(title: string, offset = 3) {
    return (
      <Tooltip title={<div dangerouslySetInnerHTML={{__html: title}}></div>}>
        <QuestionCircleOutlined
          style={{ margin: '0 3px', cursor: 'default', marginLeft: offset }}
        />
      </Tooltip>
    );
  },
};
