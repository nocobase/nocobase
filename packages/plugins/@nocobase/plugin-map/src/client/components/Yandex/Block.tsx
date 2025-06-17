import {
  RecordProvider,
  css,
  getLabelFormatValue,
  useCollection,
  useCollectionManager_deprecated,
  useCollectionParentRecordData,
  useCollection_deprecated,
  useCompile,
  useProps,
} from '@nocobase/client';
import { useMemoizedFn } from 'ahooks';
import { Button, Space } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { defaultImage, selectedImage } from '../../constants';
import { useMapTranslation } from '../../locale';
import { getSource } from '../../utils';
import { MapBlockDrawer } from '../MapBlockDrawer';
import { YandexMapComponent, YandexMapForwardedRefProps } from './Map';

export const YandexBlock = (props) => {
  const { collectionField, fieldNames, dataSource, fixedBlock, zoom, setSelectedRecordKeys } = useProps(props);
  const { name, getPrimaryKey } = useCollection_deprecated();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const primaryKey = getPrimaryKey();
  const mapRef = useRef<YandexMapForwardedRefProps>();
  const [record, setRecord] = useState();
  const { t } = useMapTranslation();
  const compile = useCompile();
  const { fields } = useCollection();
  const parentRecordData = useCollectionParentRecordData();

  const labelUiSchema = fields.find((v) => v.name === fieldNames?.marker)?.uiSchema;

  useEffect(() => {
    if (!collectionField || !mapRef.current || !dataSource) return;
    const fieldPaths = Array.isArray(fieldNames?.field) && fieldNames?.field.length > 1 ? fieldNames?.field.slice(0, -1) : fieldNames?.field;
    const cf = getCollectionJoinField([name, ...fieldPaths].flat().join('.'));
    const overlays = dataSource
      .map((item) => {
        const data = getSource(item, fieldNames?.field, cf?.interface)?.filter(Boolean);
        const title = getLabelFormatValue(labelUiSchema, item[fieldNames.marker]);
        if (!data?.length) return [];
        return data.map((mapItem) => {
          const overlay = mapRef.current?.setOverlay(collectionField.type, mapItem, {
            draggable: false,
          });
          if (overlay) {
            overlay.properties.set('extData', { id: item[primaryKey] });
            overlay.properties.set('iconCaption', fieldNames?.marker ? compile(title) : undefined);
            mapRef.current?.map.geoObjects.add(overlay);
          }
          return overlay;
        });
      })
      .flat()
      .filter(Boolean);
    if (mapRef.current?.map && overlays.length) {
      const bounds = mapRef.current.map.geoObjects.getBounds();
      bounds && mapRef.current.map.setBounds(bounds, { checkZoomRange: true });
    }
    return () => {
      overlays.forEach((ov) => mapRef.current?.map.geoObjects.remove(ov));
    };
  }, [dataSource]);

  const mapRefCallback = (instance: YandexMapForwardedRefProps) => {
    mapRef.current = instance;
  };

  return (
    <div className={css`position: relative; height: 100%;`}>
      <RecordProvider record={record} parent={parentRecordData}>
        <MapBlockDrawer />
      </RecordProvider>
      <YandexMapComponent
        {...collectionField?.uiSchema?.['x-component-props']}
        ref={mapRefCallback}
        style={{ height: fixedBlock ? '100%' : undefined }}
        zoom={zoom}
        disabled
        block
      />
    </div>
  );
};
