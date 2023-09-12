import React, { useMemo } from 'react';
import { useMapTranslation } from '../locale';
import { AMapBlock } from './AMap';
import { GoogleMapsBlock } from './GoogleMaps';

const MapBlocks = {
  amap: AMapBlock,
  google: GoogleMapsBlock,
};

export const MapBlockComponent: React.FC<any> = (props) => {
  const { t } = useMapTranslation();
  const { mapType } = props;

  const Component = useMemo(() => {
    return MapBlocks[mapType];
  }, [mapType]);

  if (!Component) {
    return <div>{t(`The ${mapType} cannot found`)}</div>;
  }

  return <Component {...props} />;
};
