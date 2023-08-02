import { Popover } from 'antd';
import { css } from '@emotion/css';
import { EditOutlined } from '@ant-design/icons';
import { useField, observer } from '@formily/react';
import React from 'react';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { InternalNester } from './InternalNester';

export const InternaPopoverNester = observer(
  (props) => {
    const content = (
      <div
        style={{ minWidth: '600px', maxHeight: '440px', overflow: 'auto' }}
        className={css`
          min-width: 600px;
          max-height: 440px;
          overflow: auto;
          .ant-card {
            border: 0px;
          }
        `}
      >
        <InternalNester {...props} />
      </div>
    );
    const titleProps = {
      ...props,
      enableLink: true,
    };
    return (
      <Popover overlayStyle={{ padding: '0px' }} content={content} trigger="click" placement="topLeft">
        <span style={{ cursor: 'pointer', display: 'inline-block', minWidth: '400px' }}>
          <div
            className={css`
              display: inline-flex;
            `}
          >
            <ReadPrettyInternalViewer {...titleProps} />
          </div>
          <EditOutlined style={{ display: 'inline-flex', marginLeft: '5px' }} />
        </span>
      </Popover>
    );
  },
  { displayName: 'InternaPopoverNester' },
);
