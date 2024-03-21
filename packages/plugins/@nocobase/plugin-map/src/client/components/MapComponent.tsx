import React, { useMemo } from 'react';
import { useMapTranslation } from '../locale';
import { AMapComponent } from './AMap';
import { GoogleMapsComponent } from './GoogleMaps';

const MapComponents = {
  amap: AMapComponent,
  google: GoogleMapsComponent,
};

export const MapComponent = React.forwardRef<any, any>((props, ref) => {
  const { t } = useMapTranslation();
  const { mapType } = props;
  const Component = useMemo(() => {
    return MapComponents[mapType];
  }, [mapType]);

  if (!Component) {
    return <div>{t(`The ${mapType} cannot found`)}</div>;
  }

  return <Component ref={ref} {...props} />;
});
MapComponent.displayName = 'MapComponent';
