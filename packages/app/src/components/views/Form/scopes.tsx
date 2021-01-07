import React from 'react';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

export default {
  text(...args: any[]) {
    return React.createElement('span', {}, ...args)
  },
  html(html: string) {
    return <div dangerouslySetInnerHTML={{__html: html}}></div>
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
