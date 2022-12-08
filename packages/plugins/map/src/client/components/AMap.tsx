import React from 'react';
import { useEffect, useRef, useCallback, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import '@amap/amap-jsapi-types';
import { useFieldSchema } from '@formily/react';
import { useCollection } from '@nocobase/client';

interface AMapComponentProps {
  accessKey: string;
  value: number[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

const AMapComponent: React.FC<AMapComponentProps> = (props) => {
  const { value, onChange, accessKey, disabled } = props;
  const id = useRef(`nocobase-map-${Date.now().toString(32)}`);
  const fieldSchema = useFieldSchema();
  const aMap = useRef<any>();
  const map = useRef<AMap.Map>();
  const mouseTool = useRef<any>();
  const [needUpdateFlag, forceUpdate] = useState([]);
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const overlayValue = useRef<any>();

  const toRemoveOverlay = () => {
    if (overlayValue.current && !value) {
      map.current?.remove(overlayValue.current);
      overlayValue.current = null;
    }
  };

  useEffect(() => {
    if (!aMap.current) return;
    if (!value || overlayValue.current) {
      return;
    }

    overlayValue.current = new aMap.current.Marker({
      position: value,
      offset: new AMap.Pixel(-13, -30),
    } as AMap.MarkerOptions);

    overlayValue.current.setMap(map.current);
  }, [value, needUpdateFlag]);

  const onMapChange = (value: any) => {
    const { lat, lng } = value.getPosition();
    if (overlayValue.current) {
      map.current.remove(overlayValue.current);
    }
    onChange([lng, lat]);
    overlayValue.current = value;
  };

  // AMap.MouseTool
  useEffect(() => {
    if (!aMap.current) return;

    if (disabled) {
      mouseTool.current?.close(true);
      toRemoveOverlay();
      return;
    }

    mouseTool.current = new aMap.current.MouseTool(map.current);

    mouseTool.current.on('draw', function ({ obj }) {
      onMapChange(obj);
    });

    switch (collectionField.interface) {
      case 'point':
        mouseTool.current.marker({
          fillColor: '#00b0ff',
          strokeColor: '#80d8ff',
        });
      default:
        return;
    }
  }, [disabled, needUpdateFlag]);

  useEffect(() => {
    if (!accessKey) return;

    AMapLoader.load({
      key: accessKey,
      version: '2.0',
      plugins: ['AMap.MouseTool'],
    }).then((amap) => {
      map.current = new amap.Map(id.current, {} as AMap.MapOptions);
      aMap.current = amap;
      forceUpdate([]);
    });
  }, [accessKey]);

  return (
    <div
      id={id.current}
      style={{
        height: '500px',
      }}
    ></div>
  );
};

export default AMapComponent;
