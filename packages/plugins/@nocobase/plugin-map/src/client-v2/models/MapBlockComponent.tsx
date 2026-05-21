/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useT } from '../locale';
import { AMapBlock } from './components/AMap';
import { GoogleMapsBlock } from './components/GoogleMaps';

const MapBlocks = {
  amap: AMapBlock,
  google: GoogleMapsBlock,
};

export const getMapFieldComponentProps = (collectionField: any) => {
  return collectionField?.getComponentProps?.() || collectionField?.uiSchema?.['x-component-props'] || {};
};

export const getMapFieldMapType = (collectionField: any) => {
  return getMapFieldComponentProps(collectionField).mapType || 'amap';
};

export const MapBlockComponent: React.FC<any> = (props) => {
  const t = useT();
  const { markerFieldCollectionField, mapFieldCollectionField } = props;
  const componentProps = getMapFieldComponentProps(mapFieldCollectionField);
  const mapType = getMapFieldMapType(mapFieldCollectionField);
  const Component = useMemo(() => {
    return MapBlocks[mapType];
  }, [mapType]);

  if (!Component) {
    return <div>{t(`The ${mapType} cannot found`)}</div>;
  }

  return (
    <Component
      {...props}
      {...componentProps}
      mapType={mapType}
      collectionField={mapFieldCollectionField}
      markerFieldCollectionField={markerFieldCollectionField}
    />
  );
};

MapBlockComponent.displayName = 'MapBlockComponent';
