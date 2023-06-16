import { connect, mapReadPretty } from '@formily/react';
import React, { useMemo } from 'react';
import AMapComponent, { AMapComponentProps } from './AMap';
import ReadPretty from './ReadPretty';
import { css } from '@emotion/css';
import Designer from './Designer';
import GoogleMapComponent from './google/GoogleMap';
import { useMapTranslation } from '../locale';

type MapProps = AMapComponentProps;

const MapComponents = {
  amap: AMapComponent,
  google: GoogleMapComponent,
};

const InternalMap = connect((props: MapProps) => {
  const { mapType } = props;
  const { t } = useMapTranslation();
  const Component = useMemo(() => {
    return MapComponents[mapType];
  }, [mapType]);

  if (!Component) {
    return <div>{t(`The ${mapType} cannot found`)}</div>;
  }
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
      <Component {...props} />
    </div>
  );
}, mapReadPretty(ReadPretty));

const Map = InternalMap as typeof InternalMap & {
  Designer: typeof Designer;
};

Map.Designer = Designer;

export default Map;
