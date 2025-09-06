/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useMapTranslation } from '../../locale';
import { AMapCom } from '../../components/AMap';
import { GoogleMapsCom } from '../../components/GoogleMaps';

const MapComponents = {
  amap: AMapCom,
  google: GoogleMapsCom,
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
