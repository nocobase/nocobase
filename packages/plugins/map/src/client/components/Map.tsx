import { connect, mapReadPretty } from '@formily/react';
import { css } from '@nocobase/client';
import React from 'react';
import { AMapComponentProps } from './AMap';
import Designer from './Designer';
import { MapComponent } from './MapComponent';
import ReadPretty from './ReadPretty';

type MapProps = AMapComponentProps;

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
      <MapComponent {...props} />
    </div>
  );
}, mapReadPretty(ReadPretty));

const Map = InternalMap as typeof InternalMap & {
  Designer: typeof Designer;
};

Map.Designer = Designer;

export { Map };
