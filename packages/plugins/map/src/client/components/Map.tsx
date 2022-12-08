import { connect, mapReadPretty } from '@formily/react';
import React from 'react';
import AMapComponent from './AMap';
import ReadPretty from './ReadPretty';
import { css } from '@emotion/css';
import Designer from './Designer';

const InternalMap = connect((props) => {
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
}, mapReadPretty(ReadPretty));

const Map = InternalMap as typeof InternalMap & {
  Designer: typeof Designer;
};

Map.Designer = Designer;

export default Map;
