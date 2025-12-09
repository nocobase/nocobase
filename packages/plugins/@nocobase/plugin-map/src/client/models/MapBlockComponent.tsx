/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { withSkeletonComponent } from '@nocobase/client';
import React, { useMemo } from 'react';
import { useMapTranslation } from '../locale';
import { AMapBlock } from './components/AMap';
import { GoogleMapsBlock } from './components/GoogleMaps';

const MapBlocks = {
  amap: AMapBlock,
  google: GoogleMapsBlock,
};

export const MapBlockComponent: React.FC<any> = withSkeletonComponent(
  (props) => {
    const { t } = useMapTranslation();
    const { markerFieldCollectionField, mapFieldCollectionField } = props;
    const { mapType } = mapFieldCollectionField?.getComponentProps?.() || {};
    const Component = useMemo(() => {
      return MapBlocks[mapType];
    }, [mapType]);

    if (!Component) {
      return <div>{t(`The ${mapType} cannot found`)}</div>;
    }

    return (
      <Component
        {...props}
        {...mapFieldCollectionField?.getComponentProps?.()}
        collectionField={mapFieldCollectionField}
        markerFieldCollectionField={markerFieldCollectionField}
      />
    );
  },
  {
    displayName: 'MapBlockComponent',
  },
);
