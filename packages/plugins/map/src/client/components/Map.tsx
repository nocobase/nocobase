import { connect, mapReadPretty } from '@formily/react';
import React from 'react';
import AMapComponent from './AMap';
import ReadPretty from './ReadPretty';
import { css } from '@emotion/css';

const Map = (props) => {
  return (
    <div
      className={css`
        border: 1px solid transparent;
        .ant-formily-item-error & {
          border: 1px solid #ff4d4f;
        }
      `}
    >
      {props.mapType ? <AMapComponent {...props} /> : null}
    </div>
  );
};

export default connect(Map, mapReadPretty(ReadPretty));
