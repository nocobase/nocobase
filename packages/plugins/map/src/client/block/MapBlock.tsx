import { useCollection, useProps } from '@nocobase/client';
import React, { useState, useRef, useEffect } from 'react';
import AMap, { AMapForwardedRefProps } from '../components/AMap';

export const MapBlock = (props) => {
  const { fieldNames, dataSource, fixedBlock, zoom } = useProps(props);
  const { getField } = useCollection();
  const field = getField(fieldNames?.field);
  const [isMapInitialization, setIsMapInitialization] = useState(false);
  const mapRef = useRef<AMapForwardedRefProps>();

  useEffect(() => {
    let overlays = [];
    dataSource?.forEach((item) => {
      const data = item[fieldNames?.field];
      if (!data) return;
      const overlay = mapRef.current.setOverlay(field.type, data);
      if (overlay) {
        overlays.push(overlay);
      }
    });

    mapRef.current.map?.setFitView(overlays);

    return () => {
      overlays.map((ov) => {
        console.log(ov);
      });
    };
  }, [isMapInitialization, dataSource]);

  const mapRefCallback = (instance: AMapForwardedRefProps) => {
    mapRef.current = instance;
    setIsMapInitialization(!!instance?.aMap);
  };

  return (
    <AMap
      {...field?.uiSchema?.['x-component-props']}
      ref={mapRefCallback}
      style={{ height: fixedBlock ? '100%' : null }}
      type={field?.type}
      zoom={zoom}
      disabled
    ></AMap>
  );
};
