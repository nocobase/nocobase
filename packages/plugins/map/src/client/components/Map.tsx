import { connect, mapReadPretty } from '@formily/react';
import React from 'react';
import AMapComponent, { AMapComponentProps } from './AMap';
import ReadPretty from './ReadPretty';
import { css } from '@emotion/css';
import Designer from './Designer';

interface MapProps extends AMapComponentProps {}

const InternalMap = connect((props: MapProps) => {
  return (
    <div
      className={css`
        height: 100%;
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
